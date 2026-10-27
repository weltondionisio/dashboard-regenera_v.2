export function assistenteRegenera(dados, municipios, rs) {
  const root = document.createElement("div");
  const shadow = root.attachShadow({mode: "open"});
  const style = document.createElement("style");
  style.textContent = `
    :host{font-family:Manrope,system-ui,sans-serif;color:#00432c}
    *{box-sizing:border-box}button,input,textarea{font:inherit}button{cursor:pointer}
    button:focus-visible,textarea:focus-visible{outline:3px solid #f06636;outline-offset:3px}
    .launch{position:fixed;right:22px;bottom:22px;z-index:1000;border:1px solid #00432c;border-radius:999px;padding:14px 20px;background:#d2e484;color:#00432c;font-weight:800;box-shadow:0 6px 22px #001f2355}
    dialog{position:fixed;inset:auto 18px 18px auto;margin:0;padding:0;width:min(460px,calc(100vw - 36px));max-width:none;height:min(690px,calc(100dvh - 36px));max-height:calc(100dvh - 36px);border:1px solid #a2c6ba;border-radius:20px;background:#fffdf6;color:#00432c;box-shadow:0 16px 60px #0005;overflow:hidden}
    dialog::backdrop{background:#001e1455}
    .panel{height:100%;display:flex;flex-direction:column}.head{padding:18px 18px 12px;background:#00432c;color:#f0ead8;display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
    h2{font-size:18px;margin:0 0 5px}p{margin:0}.head p{font-size:12px;line-height:1.5;color:#deeacc}.close{background:transparent;border:1px solid #a2c6ba;color:#f0ead8;border-radius:8px;padding:6px 9px;font-size:12px}
    .log{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}.message{font-size:14px;line-height:1.55;padding:12px;border-radius:12px;background:#edf2e8;white-space:pre-wrap;overflow-wrap:anywhere}.message.user{align-self:flex-end;max-width:90%;background:#00432c;color:#fff}.message strong{display:block;font-size:11px;margin-bottom:5px}.fact{margin-top:12px}.source{display:block;font-size:11px;color:#4e6258;margin-top:5px;line-height:1.45}.error{color:#8b2f15;background:#fff0e9}
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
  const intro = el("div"); intro.append(title, el("p", `Pergunte sobre projetos, eixos e municípios. Dados do ciclo ${dados.meta.ciclo}.`));
  head.append(intro, close);
  const log = el("div", null, "log"); log.setAttribute("role", "log"); log.setAttribute("aria-live", "polite"); log.setAttribute("aria-relevant", "additions");
  const status = el("div", null, "status"); status.setAttribute("role", "status");
  const form = el("form", null, "form");
  const label = el("label", "Sua pergunta"); label.htmlFor = "assistant-question";
  const input = el("textarea"); input.id = "assistant-question"; input.maxLength = 1200; input.placeholder = "Ex.: qual é o valor mobilizado no eixo Educação?"; input.required = true;
  const clear = el("button", "Limpar conversa", "clear"); clear.type = "button";
  const send = el("button", "Enviar", "send"); send.type = "submit";
  const actions = el("div", null, "actions"); actions.append(clear, send);
  form.append(label, input, actions); panel.append(head, log, status, form); dialog.append(panel); shadow.append(style, launch, dialog);
  let controller, generation = 0, history = [], pending = false, disposed = false;

  // Confere se a página e a API usam a mesma versão dos dados.
  const nomes = rs.objects.municipios.geometries.map(g => [String(g.properties.cd_mun), g.properties.nm_mun]);
  const version = crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({painel: dados, municipios, nomes}))).then(buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join(""));

  function message(role, text, facts = [], error = false) {
    const box = el("div", null, `message ${role}${error ? " error" : ""}`);
    box.append(el("strong", role === "user" ? "Você" : "Assistente"), el("p", text));
    for (const fact of facts) {
      const item = el("div", null, "fact");
      item.append(el("p", fact.texto), el("small", `Fonte: ${fact.fonte}`, "source"));
      box.append(item);
    }
    log.append(box); log.scrollTop = log.scrollHeight;
  }
  function ready() {pending = false; send.disabled = false; input.disabled = false; status.textContent = "";}
  function reset() {
    generation++; controller?.abort(); history = []; log.replaceChildren(); input.value = ""; ready();
    message("assistant", "Olá. Posso consultar as informações registradas neste painel. Mencione o projeto, eixo ou município na pergunta.");
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
  input.addEventListener("keydown", event => {if (event.key === "Enter" && !event.shiftKey) {event.preventDefault(); form.requestSubmit();}});
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const question = input.value.trim(); if (!question || pending || disposed) return;
    const current = ++generation; pending = true; send.disabled = true; input.disabled = true; status.textContent = "Consultando os dados do painel…";
    const previous = history.slice(-6); history.push(question); message("user", question); input.value = "";
    const requestController = new AbortController(); controller = requestController;
    const timer = setTimeout(() => requestController.abort(), 35000);
    try {
      const response = await fetch("/api/assistente", {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({pergunta: question, historico: previous, versao: await version}), signal: requestController.signal});
      let payload;
      try {payload = await response.json();} catch {throw new Error("O serviço do assistente não está disponível neste endereço.");}
      if (disposed || current !== generation) return;
      if (!response.ok) throw new Error(payload.erro || "Não foi possível consultar o assistente.");
      if (typeof payload.resposta !== "string" || !Array.isArray(payload.fatos)) throw new Error("A resposta recebida não é válida.");
      message("assistant", payload.resposta, payload.fatos);
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
