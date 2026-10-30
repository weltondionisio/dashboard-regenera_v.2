import {COR, EASE, nf, x1, el, svg, SEG, ROW, CARD, GROUP, textoEstavel, cabecalhoSecao, embrulho} from "./base.js";

const U = 2000, SLOTS = 620;
const BONECO_C = "M12 6.5m-4.2 0a4.2 4.2 0 108.4 0a4.2 4.2 0 10-8.4 0", BONECO_P = "M4.5 22.5v-2.2a7.5 7.5 0 0115 0v2.2z";

function boneco(fill, stroke, dash, sw = 1.8) {
  const s = svg("svg", {viewBox: "0 0 24 24", width: "100%", height: "100%", "aria-hidden": "true", style: "display:block;overflow:visible"});
  const c = svg("circle", {cx: 12, cy: 6.5, r: 4.2}), p = svg("path", {d: BONECO_P, "stroke-linejoin": "round"});
  for (const e of [c, p]) { e.setAttribute("fill", fill); e.setAttribute("stroke", stroke); e.setAttribute("stroke-width", sw); e.setAttribute("stroke-dasharray", dash); }
  s.append(c, p);
  return {s, c, p};
}

function Pessoas(d) {
  const ins = d.insights, T = d.totais;
  const st = {pm: "dir", pEixo: null};
  const PM = {
    dir: {label: "Diretas", kicker: "Vidas alcançadas diretamente", total: T.dir, frase: ins.P02.frase},
    ind: {label: "Indiretas", kicker: "Vidas alcançadas indiretamente", total: T.ind, frase: ins.P03.frase}
  };
  const tabs = ["dir", "ind"].map((k) => {
    const b = el("button", null, PM[k].label);
    b.onclick = () => { st.pm = k; render(); };
    return [k, b];
  });
  const grp = el("div", GROUP("rgba(210,228,132,.2)"), tabs.map((t) => t[1]));
  grp.setAttribute("role", "group"); grp.setAttribute("aria-label", "Tipo de vida");

  const grade = el("div", "display:grid;grid-template-columns:repeat(38,minmax(0,1fr));gap:3px 2px");
  const slots = Array.from({length: SLOTS}, (_, i) => {
    const b = boneco("none", "none", "0");
    const w = el("span", `display:block;aspect-ratio:1;transform-origin:50% 100%;transition:transform .6s ${EASE},opacity .6s;transition-delay:${(i % 38) * 8}ms`, b.s);
    grade.append(w);
    return {w, ...b};
  });
  const legEx = (fill, stroke, dash, txt) => {
    const b = boneco(fill, stroke, dash, 2); b.s.setAttribute("width", 14); b.s.setAttribute("height", 14); b.s.style.width = "14px";
    return el("span", "display:flex;align-items:center;gap:6px", el("span", "width:14px;height:14px;display:block", b.s), txt);
  };
  const legenda = el("div", `display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:${COR.palido}`,
    el("span", null, `1 boneco = ${nf(U)} pessoas`), legEx(COR.creme, "none", "0", "diretas"), legEx("none", COR.creme, "0", "indiretas"));
  const esquerda = el("div", "flex:3 1 560px;min-width:0;border-radius:30px;background:rgba(0,30,20,.3);border:1px solid rgba(210,228,132,.12);padding:24px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px",
    grade, legenda);

  const kicker = el("span", `font-size:13px;font-weight:600;color:${COR.salvia}`);
  const total = el("div", `font:800 54px/0.95 Unbounded,sans-serif;letter-spacing:-0.03em;color:${COR.lima}`);
  const frase = textoEstavel("margin:4px 0 0;font-size:15.5px;line-height:1.45", Object.fromEntries(Object.entries(PM).map(([k, m]) => [k, m.frase])));
  const linhas = d.eixos.map((e) => {
    const v = el("span", "font-family:Unbounded,sans-serif;font-size:17px"), sub = el("span", `font-size:14px;color:${COR.salvia};text-align:left`);
    const b = el("button", ROW,
      el("span", "display:flex;justify-content:space-between;gap:10px;width:100%;font-size:17px",
        el("span", "display:flex;align-items:center;gap:10px;font-weight:700", el("span", `width:12px;height:12px;border-radius:50%;background:${e.cor}`), e.nome), v),
      sub);
    b.onclick = () => { st.pEixo = st.pEixo === e.id ? null : e.id; render(); };
    return {e, b, v, sub};
  });
  const direita = el("div", "flex:2 1 420px;min-width:0;display:flex;flex-direction:column;gap:14px",
    el("div", CARD + "padding:24px;display:flex;flex-direction:column;gap:10px", kicker, total, frase.el),
    el("div", CARD + "padding:14px;display:flex;flex-direction:column;gap:2px", linhas.map((l) => l.b)));

  function render() {
    const M = PM[st.pm];
    tabs.forEach(([k, b]) => (b.style.cssText = SEG(st.pm === k)));
    kicker.textContent = M.kicker; total.textContent = nf(M.total); frase.mostrar(st.pm);
    const spec = [];
    for (const e of d.eixos) {
      const nd = Math.max(1, Math.round(e.dir / U)), ni = Math.max(1, Math.round(e.ind / U));
      if (st.pm !== "ind") for (let i = 0; i < nd; i++) spec.push([e, "dir"]);
      if (st.pm !== "dir") for (let i = 0; i < ni; i++) spec.push([e, "ind"]);
    }
    slots.forEach((s, i) => {
      const x = spec[i];
      if (!x) { s.w.style.transform = "scale(0)"; s.w.style.opacity = 0; return; }
      const [e, kind] = x;
      const look = kind === "dir" ? [e.cor, "none", "0"] : ["none", e.cor, "0"];
      for (const g of [s.c, s.p]) { g.setAttribute("fill", look[0]); g.setAttribute("stroke", look[1]); g.setAttribute("stroke-dasharray", look[2]); }
      s.w.style.transform = "scale(1)";
      s.w.style.opacity = st.pEixo && st.pEixo !== e.id ? 0.15 : 1;
    });
    for (const l of linhas) {
      const e = l.e, v = st.pm === "dir" ? e.dir : e.ind;
      l.v.textContent = nf(v);
      let sub;
      if (st.pm === "dir") sub = `${(100 * e.dir / T.dir).toLocaleString("pt-BR", {maximumFractionDigits: 1})}% das diretas`;
      else sub = `${x1(e.ind / e.dir)} indiretas por direta`;
      if (e.id === "hab") sub += " · 4 pessoas por casa";
      l.sub.textContent = sub;
      l.b.style.cssText = ROW + (st.pEixo === e.id ? "background:rgba(210,228,132,.14)" : "background:transparent");
    }
  }
  render();
  const sec = el("section", "display:flex;flex-direction:column;gap:18px",
    cabecalhoSecao("", "Vidas Alcançadas", grp),
    el("div", "display:flex;flex-wrap:wrap;gap:18px;align-items:stretch", esquerda, direita));
  return sec;
}

export const pessoas = (d) => embrulho(Pessoas(d));
