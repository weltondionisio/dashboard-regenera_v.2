import * as d3 from "d3";
import {COR, EASE, mi, rsmi, x1, el, svg, SEG, ROW, CARD, GROUP, textoEstavel, cabecalhoSecao, embrulho} from "./base.js";


const CENTROS_FR = {edu: [0.24, 0.37], hab: [0.59, 0.45], su: [0.83, 0.34], neg: [0.37, 0.75], multi: [0.78, 0.77]};
function alturaGrafico(largura) {
  if (largura < 640) return Math.round(Math.max(560, largura * 1.6));
  return Math.round(Math.max(380, Math.min(600, window.innerHeight - 230)));
}
const CURTO = {
  lem: "Centro Lemann", res: "Centro de Resíduos", "4d": "Escritório 4D", enc: "Encanta Hub", cufa: "CUFA",
  sos: "S.O.S Escola", sau: "Saúde Mental", rede: "Rede de Geração", ace: "Aceleração", est: "Estímulo Retomada",
  emi: "Ensino Médio Integral", leg: "Legado Habitação", rec: "Fundo Reconstruir", fav: "Favela 3D", ref: "Refundar Educação",
  tra: "Transforma Realidades", cr: "Comunidades Resilientes", su4d: "Soluções Urbanas 4D", fres: "Fundo Resiliência"
};

const SIGLA = {
  ind: "Esc. Indígenas", res: "Resíduos", lem: "Lemann", cr: "Com. Resilientes", emi: "EMI", "4d": "Escrit. 4D",
  est: "Estímulo", fav: "Favela 3D", rec: "Reconstruir", enc: "Encanta", imp: "Impacta", cufa: "CUFA", mec: "Mulher Constr.",
  mt: "Mulheres T.", tch: "Tchê I", sau: "Saúde Mental", leg: "Legado", rede: "Rede Geração", teia: "Teia I", ucd: "Casa por Dia",
  fmh: "FMHAE", ref: "Refundar", sos: "S.O.S", sup: "SuperaRS", "2p1": "2 por 1", tra: "Transforma", fut: "Futuro Vale",
  fres: "Resiliência", teia2: "Teia II", tch2: "Tchê II", su4d: "SU 4D", mt2: "Mulheres T. II", cal: "Caldeira",
  ema: "Emancipa- ção", alf: "Alfa+", tri2: "TrilhaRS II", coa: "Coalizão", ace: "Aceleração", tri: "TrilhaRS I"
};
const RMIN = 26;
const CW = 0.6;

function encaixar(texto, r, f, vf, valorTxt) {
  const palavras = texto.split(/\s+/), lh = f * 1.12;
  for (let nl = 1; nl <= 3; nl++) {
    const bloco = nl * lh + vf * 1.25;
    if (bloco > 1.7 * r) break;
    const topo = -bloco / 2;
    const corda = (y0, y1) => { const yy = Math.max(Math.abs(y0), Math.abs(y1)); return 2 * Math.sqrt(Math.max(0, r * r - yy * yy)) - 4; };
    const limite = (i) => Math.floor(corda(topo + i * lh, topo + (i + 1) * lh) / (CW * f));
    const linhas = [];
    let atual = "", i = 0, ok = true;
    for (const w of palavras) {
      const cand = atual ? atual + " " + w : w;
      if (cand.length <= limite(i)) { atual = cand; continue; }
      if (!atual || w.length > limite(i + 1)) { ok = false; break; }
      linhas.push(atual); i++; atual = w;
      if (i >= nl) { ok = false; break; }
    }
    if (!ok) continue;
    linhas.push(atual);
    if (linhas.length > nl) continue;
    const vy0 = topo + linhas.length * lh, vy1 = vy0 + vf * 1.25;
    if (valorTxt.length * 0.68 * vf > corda(vy0, vy1)) continue;
    return {linhas, lh, bloco: linhas.length * lh + vf * 1.25};
  }
  return null;
}

function Valorizacoes(d) {
  const ins = d.insights;
  const st = {vm: "mob", grouped: true, vEixo: null, hover: null};
  let W = 800, H = 560; 
  const CENTROS = new Proxy({}, {get: (_, id) => [CENTROS_FR[id][0] * W, CENTROS_FR[id][1] * H]});
  const E = Object.fromEntries(d.eixos.map((e) => [e.id, e]));
  const VM = {
    apr: {label: "Fundo RegeneraRS", kicker: "Aprovado pelo Fundo RegeneraRS", legend: "valor aprovado", tot: d.totais.apr,
          frase: () => ins.V01.frase},
    prev: {label: "Previsto", kicker: "Valor total previsto nos projetos", legend: "valor previsto", tot: d.totais.prev,
           frase: () => ins.V02.frase + " " + ins.V09.frase},
    mob: {label: "Mobilizado", kicker: "Total mobilizado pelos projetos", legend: "valor mobilizado", tot: d.totais.mob,
          frase: () => ins.V03.frase}
  };
  const val = (p, k) => p[k] || 0;

  const tabs = ["apr", "prev", "mob"].map((k) => {
    const b = el("button", null, VM[k].label);
    b.onclick = () => { st.vm = k; esconder(); render(); };
    return [k, b];
  });
  const bGrp = el("button", null, "Por eixo"), bAll = el("button", null, "Tudo junto");
  bGrp.onclick = () => { st.grouped = true; esconder(); render(); };
  bAll.onclick = () => { st.grouped = false; esconder(); render(); };
  const gMed = el("div", GROUP("rgba(210,228,132,.2)"), tabs.map((t) => t[1]));
  gMed.setAttribute("role", "group"); gMed.setAttribute("aria-label", "Medida");
  const gAgr = el("div", GROUP("rgba(240,234,216,.18)"), bGrp, bAll);
  gAgr.setAttribute("role", "group"); gAgr.setAttribute("aria-label", "Agrupamento");

  const kicker = el("span", `font-size:13px;font-weight:600;color:${COR.salvia}`);
  const total = el("div", `font:800 clamp(32px,3.1vw,50px)/1 Unbounded,sans-serif;letter-spacing:-0.03em;color:${COR.lima};white-space:nowrap`);
  const frase = textoEstavel("margin:4px 0 0;font-size:15.5px;line-height:1.45", Object.fromEntries(Object.entries(VM).map(([k, m]) => [k, m.frase()])));
  const cardTotal = el("div", CARD + "padding:24px;display:flex;flex-direction:column;gap:10px", kicker, total, frase.el);

  const linhas = d.eixos.map((e) => {
    const v = el("span", "font-family:Unbounded,sans-serif;font-size:13px");
    const pct = el("span", `font-size:11.5px;color:${COR.salvia};margin-left:6px`);
    const bar = el("span", `display:block;height:6px;border-radius:999px;background:${e.cor};transition:width .9s ${EASE}`);
    const b = el("button", ROW,
      el("span", "display:flex;justify-content:space-between;gap:10px;width:100%;font-size:13.5px",
        el("span", "display:flex;align-items:center;gap:8px;font-weight:700", el("span", `width:10px;height:10px;border-radius:50%;background:${e.cor}`), e.nome),
        el("span", null, v, pct)),
      el("span", "display:block;width:100%;height:6px;border-radius:999px;background:rgba(240,234,216,.1)", bar));
    b.onclick = () => {
      st.vEixo = st.vEixo === e.id ? null : e.id;
      if (st.vEixo) st.grouped = true;
      render();
    };
    return {e, b, v, pct, bar};
  });
  const cardEixos = el("div", CARD + "padding:14px;display:flex;flex-direction:column;gap:2px", linhas.map((l) => l.b));
  const esquerda = el("div", "flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:14px", cardTotal, cardEixos);

  const sv = svg("svg", {viewBox: `0 0 ${W} ${H}`, width: "100%", style: `display:block;width:100%;height:${H}px;overflow:visible`});
  sv.setAttribute("role", "img");
  sv.setAttribute("aria-label", "Bolhas: um círculo por projeto, área proporcional ao valor");
  const gLbl = svg("g"), gB = svg("g"), cam = svg("g");
  cam.style.transition = `transform .9s ${EASE}`;
  cam.append(gB, gLbl);
  sv.append(cam);
  let zoom = {s: 1, tx: 0, ty: 0};
  const SOMBRA = "paint-order:stroke;stroke:rgba(0,40,26,.8);stroke-width:3px;stroke-linejoin:round;pointer-events:none";
  const nodes = d.projetos.map((p) => ({p, eixo: p.eixo, x: CENTROS[p.eixo][0], y: CENTROS[p.eixo][1], r: 0}));
  for (const n of nodes) {
    const g = svg("g", {class: "bolha", tabindex: "0", role: "button"});
    g.style.transition = `transform .9s ${EASE}, opacity .5s`;
    const esc = svg("g"); esc.style.transition = `transform .9s ${EASE}`;
    const corpo = svg("circle", {r: 1, class: "corpo", fill: E[n.eixo].cor + "55", stroke: E[n.eixo].cor, "stroke-width": 1.5, "vector-effect": "non-scaling-stroke"});
    esc.append(corpo);
    const semente = svg("circle", {r: 1, fill: COR.lima});
    const gs = svg("g"); gs.style.transition = `transform .9s ${EASE}`; gs.append(semente);
    const rot = svg("text", {"text-anchor": "middle", style: `fill:${COR.creme};${SOMBRA};transition:opacity .4s`});
    g.append(esc, gs, rot);
    g.onpointerenter = (ev) => { if (ev.pointerType === "mouse") mostrar(n, ev); };
    g.onpointermove = (ev) => { if (ev.pointerType === "mouse") mostrar(n, ev); };
    g.onpointerleave = (ev) => { if (ev.pointerType === "mouse") esconder(); };
    g.onclick = (ev) => { ev.stopPropagation(); st.hover === n ? esconder() : mostrar(n, null); };
    g.onfocus = () => mostrar(n, null);
    g.onblur = () => esconder();
    g.onkeydown = (ev) => { if (ev.key === "Escape") esconder(); };
    Object.assign(n, {g, esc, corpo, gs, rot});
    gB.append(g);
  }
  const rotEixo = d.eixos.map((e) => {
    const t = svg("text", {"text-anchor": "middle", style: `font:700 12px Manrope,sans-serif;fill:${e.cor};transition:opacity .5s;pointer-events:none`});
    gLbl.append(t);
    return {e, t};
  });

  const tip = el("div", `position:absolute;left:0;top:0;z-index:5;pointer-events:none;opacity:0;transition:opacity .15s;max-width:270px;background:${COR.creme};color:${COR.verde};border-radius:16px;padding:12px 14px;box-shadow:0 10px 30px rgba(0,20,12,.45);font:500 12.5px/1.4 Manrope,sans-serif`);
  tip.setAttribute("role", "tooltip");
  const legenda = el("div", `display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:${COR.palido};padding:0 18px 14px`);
  const direita = el("div", `flex:3 1 640px;min-width:0;position:relative;border-radius:30px;background:radial-gradient(ellipse at 50% 45%,rgba(210,228,132,.08),rgba(0,30,20,.25) 70%);border:1px solid rgba(210,228,132,.12);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding-top:6px`,
    sv, legenda, tip);
  direita.onclick = () => esconder();

  function conteudoTip(n) {
    const p = n.p;
    const linha = (rotulo, k) => el("div", `display:flex;justify-content:space-between;gap:14px;${st.vm === k ? "font-weight:800" : ""}`,
      el("span", null, rotulo), el("span", "font-family:Unbounded,sans-serif;font-size:12px", p[k] ? rsmi(p[k]) : "—"));
    tip.replaceChildren(
      el("div", "font:700 14px/1.3 Manrope,sans-serif;margin-bottom:2px", p.nome),
      el("div", "display:flex;align-items:center;gap:6px;font-size:11.5px;opacity:.75;margin-bottom:8px",
        el("span", `width:8px;height:8px;border-radius:50%;background:${E[n.eixo].cor}`), `${E[n.eixo].nome} · ${p.fase}`),
      linha("Fundo RegeneraRS", "apr"), linha("Previsto", "prev"), linha("Mobilizado", "mob"),
      el("div", `margin-top:8px;font:600 14px Unbounded,sans-serif;color:${COR.tijolo}`,
        p.mob ? `mobilizou ${x1(p.mob / p.apr)}× o aporte` : "ainda sem mobilização"));
  }
  function mostrar(n, ev) {
    if (n.r <= 0.5) return;
    if (st.hover !== n) { if (st.hover) destacar(st.hover, false); st.hover = n; destacar(n, true); conteudoTip(n); }
    const box = direita.getBoundingClientRect(), esc = box.width / W;
    let x, y;
    if (ev) { x = ev.clientX - box.left; y = ev.clientY - box.top; }
    else { x = (n.x * zoom.s + zoom.tx) * esc; y = ((n.y - n.r) * zoom.s + zoom.ty) * esc + 6; }
    const tw = tip.offsetWidth || 240, th = tip.offsetHeight || 140;
    let left = x + 16, top = y + 16;
    if (left + tw > box.width - 8) left = x - tw - 16;
    if (top + th > box.height - 8) top = y - th - 16;
    tip.style.transform = `translate(${Math.max(8, left)}px,${Math.max(8, top)}px)`;
    tip.style.opacity = 1;
  }
  function esconder() {
    if (st.hover) destacar(st.hover, false);
    st.hover = null;
    tip.style.opacity = 0;
  }
  function destacar(n, on) {
    n.corpo.setAttribute("stroke", on ? "#fff" : E[n.eixo].cor);
    n.corpo.setAttribute("stroke-width", on ? 2.5 : 1.5);
    n.corpo.setAttribute("fill", E[n.eixo].cor + (on ? "88" : "55"));
  }

  function layout() {
    const tot = d3.sum(nodes, (n) => val(n.p, st.vm));
    const k0 = Math.sqrt((0.3 * W * H) / (Math.PI * tot));
    for (let tentativa = 0, k = k0; tentativa < 8; tentativa++, k *= 0.93) {
      for (const n of nodes) { const v = val(n.p, st.vm); n.r = v > 0 ? Math.max(W < 640 ? 21 : RMIN, k * Math.sqrt(v)) : 0; n.rs = k * Math.sqrt(n.p.apr); }
      if (st.grouped ? layoutPorEixo() : layoutJunto()) break;
    }
    for (const n of nodes) if (n.r <= 0.5) {
      n.x = st.grouped ? CENTROS[n.eixo][0] : W / 2;
      n.y = st.grouped ? CENTROS[n.eixo][1] : H / 2;
    }
  }

  function layoutPorEixo() {
    const grupos = d3.groups(nodes.filter((n) => n.r > 0.5), (n) => n.eixo).map(([id, ns]) => {
      const cs = ns.map((n) => ({n, r: n.r + 2})).sort((a, b) => b.r - a.r || d3.ascending(a.n.p.id, b.n.p.id));
      d3.packSiblings(cs);
      const enc = d3.packEnclose(cs);
      return {id, cs, enc, r: enc.r, x: CENTROS[id][0], y: CENTROS[id][1]};
    });
    const lim = (g) => {
      g.x = Math.max(g.r + 4, Math.min(W - g.r - 4, g.x));
      g.y = Math.max(g.r + 26, Math.min(H - g.r - 6, g.y));
    };
    const sim = d3.forceSimulation(grupos)
      .force("x", d3.forceX((g) => CENTROS[g.id][0]).strength(0.08))
      .force("y", d3.forceY((g) => CENTROS[g.id][1]).strength(0.08))
      .force("c", d3.forceCollide((g) => g.r + 22).iterations(6))
      .stop();
    for (let i = 0; i < 400; i++) { sim.tick(); grupos.forEach(lim); }
    for (const g of grupos) for (const c of g.cs) { c.n.x = g.x + c.x - g.enc.x; c.n.y = g.y + c.y - g.enc.y; }
    for (let i = 0; i < grupos.length; i++) for (let j = i + 1; j < grupos.length; j++) {
      const a = grupos[i], b = grupos[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 12) return false;
    }
    return true;
  }

  function layoutJunto() {
    const vivos = nodes.filter((n) => n.r > 0.5).sort((a, b) => b.r - a.r || d3.ascending(a.p.id, b.p.id));
    vivos.forEach((n, i) => {
      const ang = i * 2.39996, rad = 14 * Math.sqrt(i);
      n.x = W / 2 + Math.max(1, W / H) * rad * Math.cos(ang); n.y = H / 2 + rad * Math.sin(ang);
      n.vx = n.vy = 0;
    });
    const sim = d3.forceSimulation(vivos)
      .force("x", d3.forceX(W / 2).strength(0.05))
      .force("y", d3.forceY(H / 2).strength(0.09))
      .force("c", d3.forceCollide((n) => n.r + 2.5).iterations(4))
      .stop();
    for (let i = 0; i < 400; i++) {
      sim.tick();
      for (const n of vivos) {
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x));
        n.y = Math.max(n.r + 8, Math.min(H - n.r - 6, n.y));
      }
    }
    for (let i = 0; i < vivos.length; i++) for (let j = i + 1; j < vivos.length; j++) {
      const a = vivos[i], b = vivos[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 0.5) return false;
    }
    return true;
  }

  function rotular(n, v) {
    n.rot.replaceChildren();
    const valorTxt = mi(v);
    const nomes = [CURTO[n.p.id] ?? n.p.nome, SIGLA[n.p.id]].filter(Boolean);
    let achou = null, f = 0, vf = 0;
    busca: for (const nome of nomes) {
      for (f = Math.min(13, Math.max(7, n.r / 3.4)); f >= 7; f -= 0.5) {
        vf = Math.max(6.5, f * 0.88);
        achou = encaixar(nome, n.r, f, vf, valorTxt);
        if (achou) break busca;
      }
    }
    if (!achou) return;
    let y = -achou.bloco / 2 + f * 0.86;
    for (const linha of achou.linhas) {
      const t = svg("tspan", {x: 0, y: y.toFixed(1), style: `font:700 ${f}px Manrope,sans-serif`});
      t.textContent = linha;
      n.rot.append(t);
      y += achou.lh;
    }
    const tv = svg("tspan", {x: 0, y: (y + vf * 0.25).toFixed(1), style: `font:600 ${vf.toFixed(1)}px Unbounded,sans-serif`});
    tv.textContent = valorTxt;
    n.rot.append(tv);
  }

  function enquadrar() {
    const its = st.vEixo ? nodes.filter((n) => n.eixo === st.vEixo && n.r > 0.5) : [];
    if (!its.length) { zoom = {s: 1, tx: 0, ty: 0}; }
    else {
      const x0 = d3.min(its, (n) => n.x - n.r), x1 = d3.max(its, (n) => n.x + n.r);
      const y0 = d3.min(its, (n) => n.y - n.r) - (st.grouped ? 24 : 0), y1 = d3.max(its, (n) => n.y + n.r);
      const s = Math.max(1, Math.min(2.4, (0.86 * W) / (x1 - x0), (0.86 * H) / (y1 - y0)));
      zoom = {s, tx: W / 2 - s * (x0 + x1) / 2, ty: H / 2 - s * (y0 + y1) / 2};
    }
    cam.style.transform = `translate(${zoom.tx.toFixed(1)}px,${zoom.ty.toFixed(1)}px) scale(${zoom.s.toFixed(3)})`;
  }

  function opacidades() {
    for (const n of nodes) {
      const ativo = n.r > 0.5 && (!st.vEixo || st.vEixo === n.eixo);
      n.g.style.opacity = ativo ? 1 : 0;
      n.g.style.pointerEvents = ativo ? "auto" : "none";
    }
    for (const {e, t} of rotEixo) {
      const vivo = nodes.some((n) => n.eixo === e.id && n.r > 0.5);
      t.style.opacity = vivo && st.grouped && (!st.vEixo || st.vEixo === e.id) ? 1 : 0;
    }
  }

  function render() {
    const M = VM[st.vm];
    tabs.forEach(([k, b]) => (b.style.cssText = SEG(st.vm === k)));
    const travado = !!st.vEixo, estiloTrava = travado ? ";opacity:.45;cursor:not-allowed" : "";
    bGrp.style.cssText = SEG(st.grouped) + estiloTrava; bAll.style.cssText = SEG(!st.grouped) + estiloTrava;
    bGrp.disabled = bAll.disabled = travado;
    gAgr.title = travado ? "Desmarque o eixo para mudar o agrupamento" : "";
    kicker.textContent = M.kicker;
    total.textContent = rsmi(M.tot);
    frase.mostrar(st.vm);

    for (const l of linhas) {
      const v = l.e[st.vm];
      l.v.textContent = rsmi(v);
      l.pct.textContent = (100 * v / M.tot).toLocaleString("pt-BR", {maximumFractionDigits: 0}) + "%";
      l.bar.style.width = (100 * v / M.tot).toFixed(1) + "%";
      l.b.style.cssText = ROW + (st.vEixo === l.e.id ? "background:rgba(210,228,132,.14)" : "background:transparent");
    }

    layout();
    const showSeed = st.vm !== "apr";
    for (const n of nodes) {
      n.g.style.transform = `translate(${n.x.toFixed(1)}px,${n.y.toFixed(1)}px)`;
      n.esc.style.transform = `scale(${Math.max(n.r, 0.001).toFixed(2)})`;
      n.gs.style.transform = `scale(${(showSeed ? Math.min(n.rs, n.r) : 0.001).toFixed(2)})`;
      const v = val(n.p, st.vm);
      n.g.setAttribute("aria-label", `${n.p.nome} · ${v ? rsmi(v) : "sem valor"}`);
      rotular(n, v);
    }
    for (const {e, t} of rotEixo) {
      const its = nodes.filter((n) => n.eixo === e.id && n.r > 0.5);
      if (!its.length) { t.style.opacity = 0; continue; }
      const top = d3.min(its, (n) => n.y - n.r), cx = d3.mean(its, (n) => n.x);
      t.setAttribute("x", Math.max(80, Math.min(W - 80, cx)).toFixed(1));
      t.setAttribute("y", Math.max(14, top - 8).toFixed(1));
      t.textContent = `${e.nome} · ${rsmi(e[st.vm])}`;
    }
    opacidades();
    enquadrar();
    legenda.replaceChildren(...[
      el("span", null, `círculo = um projeto · área = ${M.legend} (R$ milhões)`),
      showSeed ? el("span", "display:flex;align-items:center;gap:6px", el("span", `width:10px;height:10px;border-radius:50%;background:${COR.lima}`), "semente = Fundo RegeneraRS") : null,
      st.vm === "mob" ? el("span", null, `${d.totais.n - d.totais.n_mob} projetos ainda sem mobilização não aparecem`) : null,
      el("span", `color:${COR.salvia}`, "projetos muito pequenos aparecem com tamanho mínimo · passe o mouse numa bolha para ver os valores")
    ].filter(Boolean));
  }
  render();

  function semTransicao(fn) {
    const els = [cam, ...nodes.flatMap((n) => [n.g, n.esc, n.gs])];
    els.forEach((e) => (e.dataset.tr = e.style.transition, e.style.transition = "none"));
    fn();
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach((e) => (e.style.transition = e.dataset.tr))));
  }
  let primeiro = true, espera = null;
  function dimensionar() {
    const w = Math.round(sv.getBoundingClientRect().width);
    if (!w) return;
    const h = alturaGrafico(w);
    if (Math.abs(w - W) < 4 && Math.abs(h - H) < 4) return;
    W = w; H = h;
    sv.setAttribute("viewBox", `0 0 ${W} ${H}`);
    sv.style.height = `${H}px`;
    esconder();
    if (primeiro) { primeiro = false; semTransicao(render); } else render();
  }
  const ro = new ResizeObserver(() => { clearTimeout(espera); espera = setTimeout(dimensionar, primeiro ? 0 : 150); });
  ro.observe(direita);
  window.addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(dimensionar, 150); });

  return el("section", "display:flex;flex-direction:column;gap:18px",
    cabecalhoSecao("Transversal · 01", "Valorizações", gMed, gAgr),
    el("div", "display:flex;flex-wrap:wrap;gap:18px;align-items:stretch", esquerda, direita));
}

export const valorizacoes = (d) => embrulho(Valorizacoes(d));
