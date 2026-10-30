import {COR, PAL, IC, nf, rsmi, el, iconSvg, CARD, cabecalhoSecao, embrulho} from "./base.js";

function Eixos(d) {
  const st = {eixo: "edu"};
  const tabs = d.eixos.map((e) => {
    const b = el("button", null, el("span", `width:9px;height:9px;border-radius:50%;background:${e.cor}`), e.nome);
    b.setAttribute("role", "tab");
    b.onclick = () => { st.eixo = e.id; render(); };
    return {e, b};
  });
  const lista = el("div", "display:flex;gap:6px;flex-wrap:wrap", tabs.map((t) => t.b));
  lista.setAttribute("role", "tablist"); lista.setAttribute("aria-label", "Eixo");

  const pill = el("span"), manchete = el("p", "margin:0;font:600 20px/1.35 Manrope,sans-serif;max-width:760px");
  const heroTot = el("span", `font:800 64px/0.9 Unbounded,sans-serif;letter-spacing:-0.04em;color:${COR.lima}`);
  const heroLbl = el("span", "font:600 17px Manrope,sans-serif;max-width:420px");
  const icones = el("div", "display:flex;flex-wrap:wrap;gap:4px");
  const partes = el("div", `display:flex;flex-wrap:wrap;gap:8px 18px;font-size:12.5px;color:${COR.palido}`);
  const nota = el("p", `margin:0;font-size:12px;line-height:1.45;color:${COR.salvia};max-width:760px`);
  const hero = el("div", "flex:3 1 640px;min-width:0;border-radius:30px;background:rgba(0,30,20,.3);border:1px solid rgba(210,228,132,.12);padding:26px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px",
    el("div", "display:flex;align-items:baseline;gap:14px;flex-wrap:wrap", heroTot, heroLbl), icones, partes, nota);
  const cards = el("div", "flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:12px");
  const projs = el("div", "background:rgba(240,234,216,.04);border:1px solid rgba(210,228,132,.14);border-radius:26px;padding:8px 18px");

  function render() {
    const e = d.eixos.find((x) => x.id === st.eixo);
    tabs.forEach(({e: t, b}) => (b.style.cssText = "display:flex;align-items:center;gap:8px;font:600 13px Manrope,sans-serif;border-radius:999px;padding:10px 16px;cursor:pointer;" +
      (t.id === st.eixo ? `background:${COR.creme};color:${COR.verde};border:1px solid ${COR.creme}` : `background:transparent;color:${COR.creme};border:1px solid rgba(240,234,216,.25)`)));
    pill.style.cssText = `font:600 12px Unbounded,sans-serif;letter-spacing:.06em;text-transform:uppercase;background:${e.cor};color:${COR.verde};border-radius:999px;padding:9px 14px`;
    pill.textContent = e.nome;
    manchete.textContent = e.manchete;
    const h = e.hero;
    heroTot.textContent = nf(h.total);
    heroLbl.textContent = h.label;
    icones.replaceChildren(...h.parts.flatMap((p, i) => Array.from({length: Math.max(1, Math.round(p.n / h.unit))}, () => iconSvg(IC[h.icon], 22, PAL[i % PAL.length]))));
    partes.replaceChildren(...h.parts.map((p, i) => {
      const s = el("span", "display:flex;align-items:center;gap:7px", el("span", `width:10px;height:10px;border-radius:3px;background:${PAL[i % PAL.length]}`), `${p.nome} · `, el("b", null, nf(p.n)));
      return s;
    }), el("span", `color:${COR.salvia}`, `1 ícone = ${nf(h.unit)}`));
    nota.textContent = h.nota;
    nota.style.display = h.nota ? "" : "none";
    cards.replaceChildren(...e.cards.map((k) => el("div", CARD.replace("28px", "24px") + "padding:18px;display:flex;gap:14px;align-items:center",
      el("span", "flex:0 0 44px;height:44px;border-radius:14px;background:rgba(210,228,132,.14);display:flex;align-items:center;justify-content:center", iconSvg(IC[k.icon], 22, COR.lima, 1.8)),
      el("span", "display:flex;flex-direction:column;gap:2px",
        el("span", "font:800 24px Unbounded,sans-serif;letter-spacing:-0.02em", k.v),
        el("span", `font-size:12.5px;line-height:1.4;color:${COR.palido}`, k.l)))));
    const ps = d.projetos.filter((p) => p.eixo === e.id).sort((a, b) => (b.mob || 0) - (a.mob || 0));
    const cab = el("div", `padding:12px 4px 10px;border-bottom:1px solid rgba(240,234,216,.14);font:600 13px Unbounded,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${COR.salvia}`,
      (() => { const x = el("span", null, "Projeto"); x.className = "lp-nome"; return x; })(),
      (() => { const x = el("span", null, "O que entregou"); x.className = "lp-entrega"; return x; })(),
      (() => { const x = el("span", "text-align:right", "Mobilizado"); x.className = "lp-mob"; x.title = "Valor total mobilizado pelo projeto até jul/2026, incluindo o aporte do RegeneraRS"; return x; })());
    cab.className = "linha-proj";
    projs.replaceChildren(cab, ...ps.map((p) => {
      const nome = el("span", "font-weight:700;font-size:14px", p.nome);
      const ent = el("span", `font-size:13px;color:${COR.palido}`, p.entrega);
      const mob = el("span", "font:600 13px Unbounded,sans-serif;text-align:right;white-space:nowrap", p.mob ? rsmi(p.mob) : "—");
      nome.className = "lp-nome"; ent.className = "lp-entrega"; mob.className = "lp-mob";
      const linha = el("div", "padding:14px 4px;border-bottom:1px solid rgba(240,234,216,.08)", nome, ent, mob);
      linha.className = "linha-proj";
      return linha;
    }));
  }
  render();
  const sec = el("section", "display:flex;flex-direction:column;gap:18px",
    cabecalhoSecao("Por eixo", "O que cada eixo entregou", lista),
    el("div", "display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;padding:6px 0", pill, manchete),
    el("div", "display:flex;flex-wrap:wrap;gap:18px;align-items:stretch", hero, cards),
    projs);
  return sec;
}

export const eixos = (d) => embrulho(Eixos(d));
