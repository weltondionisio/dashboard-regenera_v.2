import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {createCatalog, modelRequest, validateSelection, enrichSelection, writerEvidence, writerRequest, validateNarrative, fallbackNarrative} from "../server/assistente-core.js";

let catalogPromise;
async function loadCatalog() {
  catalogPromise ??= Promise.all(["painel.json", "municipios.json", "rs.json"].map(async name => JSON.parse(await readFile(join(process.cwd(), "src", "data", name), "utf8")))).then(data => createCatalog(...data)).catch(error => {catalogPromise = undefined; throw error;});
  return catalogPromise;
}

class RequestError extends Error {
  constructor(status, message) {super(message); this.status = status;}
}

async function readBody(req) {
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) throw new RequestError(415, "Envie a pergunta no formato JSON.");
  let body = req.body;
  if (body === undefined) {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 16000) throw new RequestError(413, "A mensagem é muito longa.");
      chunks.push(Buffer.from(chunk));
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    if (Buffer.byteLength(body) > 16000) throw new RequestError(413, "A mensagem é muito longa.");
    try {body = JSON.parse(body);} catch {throw new RequestError(400, "A mensagem não é válida.");}
  }
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => !["pergunta", "historico", "versao"].includes(k))) throw new RequestError(400, "Formato de mensagem não permitido.");
  if (Buffer.byteLength(JSON.stringify(body)) > 16000) throw new RequestError(413, "A mensagem é muito longa.");
  const question = typeof body.pergunta === "string" ? body.pergunta.trim() : "";
  if (!question || question.length > 1200) throw new RequestError(400, "Escreva uma pergunta de até 1.200 caracteres.");
  const history = body.historico ?? [];
  const validHistoryItem = item => {
    if (typeof item === "string") return item.length <= 1200;
    return item && typeof item === "object" && !Array.isArray(item) && Object.keys(item).every(k => ["role", "content"].includes(k)) && ["user", "assistant"].includes(item.role) && typeof item.content === "string" && item.content.length <= 2400;
  };
  if (!Array.isArray(history) || history.length > 6 || history.some(item => !validHistoryItem(item))) throw new RequestError(400, "Histórico inválido.");
  if (typeof body.versao !== "string" || !/^[a-f0-9]{64}$/.test(body.versao)) throw new RequestError(400, "Atualize a página antes de consultar o assistente.");
  return {question, history, version: body.versao};
}

export function createHandler({getCatalog = loadCatalog, fetchImpl = globalThis.fetch, env = process.env} = {}) {
  return async function handler(req, res) {
    const deadline = Date.now() + 52000;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const send = (status, data) => {res.statusCode = status; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(data));};
    if (req.method !== "POST") {res.setHeader("Allow", "POST"); return send(405, {erro: "Método não permitido."});}
    try {
      const origin = req.headers.origin;
      const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
      if (origin && new URL(origin).host !== host) return send(403, {erro: "Origem não permitida."});
      const {question, history, version} = await readBody(req);
      const catalog = await getCatalog();
      if (version !== catalog.versao) return send(409, {erro: "Os dados foram atualizados. Recarregue a página para continuar."});
      const key = env.GEMINI_API_KEY?.trim();
      if (!key) return send(503, {erro: "O assistente está temporariamente indisponível."});
      const model = env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
      if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(model)) throw new Error("Invalid model configuration");
      async function generate(request) {
        const remaining = deadline - Date.now();
        if (remaining < 500) throw new RequestError(504, "A consulta demorou mais que o esperado. Tente novamente.");
        const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: "POST", headers: {"Content-Type": "application/json", "x-goog-api-key": key},
          body: JSON.stringify(request), signal: AbortSignal.timeout(Math.min(25000, remaining))
        });
        if (!response.ok) {
          if (response.status === 429) throw new RequestError(429, "O limite de consultas foi atingido. Tente novamente em alguns instantes.");
          throw new RequestError(502, "Não foi possível consultar o assistente agora. Tente novamente.");
        }
        const payload = await response.json();
        const candidate = payload.candidates?.[0];
        if (candidate?.finishReason !== "STOP") throw new Error("Incomplete model response");
        const text = candidate.content?.parts?.filter(p => typeof p.text === "string" && !p.thought).map(p => p.text).join("") || "";
        return JSON.parse(text);
      }

      // Primeiro localiza os dados. Depois explica somente os fatos validados.
      const selection = await generate(modelRequest(question, history, catalog));
      const facts = enrichSelection(validateSelection(selection, catalog), question, history, catalog);
      let answer = fallbackNarrative(facts);
      let mode = facts.length ? "resumo" : "sem_dados";
      if (facts.length) {
        try {
          const evidence = writerEvidence(facts);
          const narrative = await generate(writerRequest(question, history, facts, evidence));
          answer = validateNarrative(narrative, facts, evidence);
          mode = "narrativo";
        } catch (error) {
          // Mantém uma resposta da fonte se a etapa de redação falhar.
          console.warn("Assistente RegeneraRS: resumo da fonte utilizado;", error.name);
        }
      }
      return send(200, {resposta: answer, fatos: facts, ciclo: catalog.ciclo, versao: catalog.versao, modo: mode});
    } catch (error) {
      if (error instanceof RequestError) return send(error.status, {erro: error.message});
      if (error.name === "TimeoutError" || error.name === "AbortError") return send(504, {erro: "A consulta demorou mais que o esperado. Tente novamente."});
      console.error("Assistente RegeneraRS:", error.name);
      return send(502, {erro: "Não foi possível obter uma resposta validada. Tente reformular a pergunta."});
    }
  };
}

export default createHandler();
