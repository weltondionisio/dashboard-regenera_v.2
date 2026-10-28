export function assistenteRegenera(dados, municipios, rs) {
  const root = document.createElement("div");
  const shadow = root.attachShadow({mode: "open"});
  const style = document.createElement("style");
  style.textContent = `
    :host{font-family:Manrope,system-ui,sans-serif;color:#00432c}
    *{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer}
    button:focus-visible,textarea:focus-visible{outline:3px solid #f06636;outline-offset:3px}
    .launch{position:fixed;right:22px;bottom:22px;z-index:1000;border:1px solid #00432c;border-radius:999px;padding:14px 20px;background:#d2e484;color:#00432c;font-weight:800;box-shadow:0 6px 22px #001f2355}
    dialog{position:fixed;inset:auto 18px 18px auto;margin:0;padding:0;width:min(520px,calc(100vw - 36px));max-width:none;height:min(730px,calc(100dvh - 36px));max-height:calc(100dvh - 36px);border:1px solid #a2c6ba;border-radius:20px;background:#fffdf6;color:#00432c;box-shadow:0 16px 60px #0005;overflow:hidden}
    dialog::backdrop{background:#001e1455}
    .panel{height:100%;display:flex;flex-direction:column}.head{padding:18px 18px 12px;background:#00432c;color:#f0ead8;display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
    h2{font-size:18px;margin:0 0 5px}p{margin:0}.head p{font-size:12px;line-height:1.5;color:#deeacc}.close{background:transparent;border:1px solid #a2c6ba;color:#f0ead8;border-radius:8px;padding:6px 9px;font-size:12px}
    .log{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}.message{font-size:14px;line-height:1.65;padding:14px;border-radius:12px;background:#edf2e8;overflow-wrap:anywhere}.message.user{align-self:flex-end;max-width:90%;background:#00432c;color:#fff}.role{display:block;font-size:11px;margin-bottom:7px}.body p{margin:0 0 12px;white-space:pre-wrap}.body p:last-child{margin-bottom:0}.sources{margin-top:14px;padding-top:10px;border-top:1px solid #cad8c4;font-size:12px;color:#4e6258}.sources summary{cursor:pointer;font-weight:700;padding:4px 0}.sources ol{margin:10px 0 0;padding-left:19px;max-height:230px;overflow-y:auto}.sources li{padding:0 0 12px}.sources li p{margin:0}.source{display:block;font-size:11px;margin-top:5px;line-height:1.5;overflow-wrap:anywhere}.error{color:#8b2f15;background:#fff0e9}
    .status{min-height:22px;padding:0 16px;font-size:12px;color:#4e6258}.form{border-top:1px solid #d3ddd0;padding:12px 16px 16px;display:grid;gap:9px}.form label{font-size:12px;font-weight:700}textarea{width:100%;resize:none;min-height:66px;border:1px solid #8a9c8c;border-radius:10px;padding:10px;background:white;color:#123c2a;font-size:14px}.actions{display:flex;justify-content:space-between;gap:10px}.send{background:#00432c;color:#fff;border:0;border-radius:9px;padding:9px 18px;font-weight:700}.clear{border:1px solid #9bb19e;color:#00432c;background:transparent;border-radius:9px;padding:9px 12px}button:disabled{opacity:.5;cursor:wait}
    @media(max-width:520px){dialog{inset:8px;width:calc(100vw - 16px);height:calc(100dvh - 16px);max-height:none}.launch{right:14px;bottom:14px}}
  `;
  const el = (tag, text, className) => {const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node;};
  const launch = el("button", "Assistente RegeneraRS", "launch");
  launch.type = "button"; launch.setAttribute("aria-haspopup", "dialog"); launch.setAttribute("aria-expanded", "false");
  const dialog = el("dialog"); dialog.setAttribute("aria-labelledby", "assistant-title");
  const panel = el("div", null, "panel"), head = el("header", null, "head");
  const title = el("h2", "Assistente RegeneraRS"); title.id = "assistant-title";
  const close = el("button", "Fechar", "close"); close.type = "button";
  const intro = el("div"); intro.append(title, el("p", `Ajuda para entender os projetos e os gráficos. Dados de ${dados.meta.ciclo}.`));
  head.append(intro, close);
  const log = el("div", null, "log"); log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-relevant", "additions");
  const status = el("div", null, "status"); status.setAttribute("role", "status");
  const form = el("form", null, "form");
  const label = el("label", "Sua pergunta"); label.htmlFor = "assistant-question";
  const input = el("textarea"); input.id = "assistant-question"; input.maxLength = 1200; input.placeholder = "O que você gostaria de entender sobre o RegeneraRS?"; input.required = true;
  const clear = el("button", "Limpar conversa", "clear"); clear.type = "button";
  const send = el("button", "Enviar", "send"); send.type = "submit";
  const actions = el("div", null, "actions"); actions.append(clear, send);
  form.append(label, input, actions); panel.append(head, log, status, form); dialog.append(panel); shadow.append(style, launch, dialog);
  let controller, generation = 0, history = [], pending = false, disposed = false;

  // Confere se a página e a API usam a mesma versão dos dados.
  const nomes = rs.objects.municipios.geometries.map(g => [String(g.properties.cd_mun), g.properties.nm_mun]);
  const version = crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({painel: dados, municipios, nomes}))).then(buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join(""));

  function appendText(node, text) {
    // Formata apenas negrito; o conteúdo nunca é interpretado como HTML.
    for (const part of String(text).split(/(\*\*[^*\n]{1,160}\*\*)/g)) {
      node.append(part.startsWith("**") && part.endsWith("**") ? el("strong", part.slice(2, -2)) : document.createTextNode(part));
    }
  }
  function message(role, text, facts = [], error = false) {
    const box = el("div", null, `message ${role}${error ? " error" : ""}`);
    const body = el("div", null, "body");
    for (const paragraph of String(text).split(/\n\s*\n/).filter(p => p.trim())) {
      const p = el("p"); appendText(p, paragraph); body.append(p);
    }
    box.append(el("strong", role === "user" ? "Você" : "Assistente", "role"), body);
    if (facts.length) {
      const details = el("details", null, "sources");
      details.append(el("summary", "Fontes e dados consultados"));
      const list = el("ol");
      for (const fact of facts) {
        if (typeof fact.texto !== "string") continue;
        const item = el("li");
        const source = String(fact.fonte || "Dados do painel").replace(/&#91;/g, "[").replace(/&#93;/g, "]");
        item.append(el("p", fact.texto), el("small", source, "source")); list.append(item);
      }
      details.append(list); box.append(details);
    }
    log.append(box); log.scrollTop = log.scrollHeight;
  }
  function ready() {pending = false; send.disabled = false; input.disabled = false; log.setAttribute("aria-busy", "false"); status.textContent = "";}
  function reset() {
    generation++; controller?.abort(); history = []; log.replaceChildren(); input.value = ""; ready();
    message("assistant", "Olá. Posso ajudar você a entender os projetos e os gráficos do RegeneraRS. Pergunte do seu jeito: posso explicar os indicadores, comparar resultados e mostrar onde há mais projetos.");
    if (dialog.open) input.focus();
  }
  reset();
  launch.addEventListener("click", () => {dialog.showModal(); launch.setAttribute("aria-expanded", "true"); input.focus();});
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {launch.setAttribute("aria-expanded", "false"); launch.focus();});
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  clear.addEventListener("click", reset);
  input.addEventListener("keydown", event => {if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {event.preventDefault(); form.requestSubmit();}});
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const question = input.value.trim(); if (!question || pending || disposed) return;
    const current = ++generation; pending = true; send.disabled = true; input.disabled = true; log.setAttribute("aria-busy", "true"); status.textContent = "Consultando os dados e preparando a explicação…";
    const previous = history.slice(-6); message("user", question); input.value = "";
    const requestController = new AbortController(); controller = requestController;
    const timer = setTimeout(() => requestController.abort(), 58000);
    try {
      const payloadRequest = {pergunta: question, historico: previous, versao: await version};
      while (previous.length && new TextEncoder().encode(JSON.stringify(payloadRequest)).length > 15000) previous.shift();
      const response = await fetch("/api/assistente", {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payloadRequest), signal: requestController.signal});
      let payload;
      try {payload = await response.json();} catch {throw new Error("O serviço do assistente não está disponível neste endereço.");}
      if (disposed || current !== generation) return;
      if (!response.ok) throw new Error(payload.erro || "Não foi possível consultar o assistente.");
      if (typeof payload.resposta !== "string" || !Array.isArray(payload.fatos)) throw new Error("A resposta recebida não é válida.");
      message("assistant", payload.resposta, payload.fatos);
      history.push({role: "user", content: question}, {role: "assistant", content: payload.resposta.slice(0, 2400)});
      history = history.slice(-6);
    } catch (error) {
      if (!disposed && current === generation) message("assistant", error.name === "AbortError" ? "A consulta foi interrompida. Tente novamente." : error.message, [], true);
    } finally {
      clearTimeout(timer);
      if (!disposed && current === generation) {ready(); if (dialog.open) input.focus();}
    }
  });
  root.destroy = () => {disposed = true; generation++; controller?.abort(); if (dialog.open) dialog.close(); root.remove();};
  return root;
}
