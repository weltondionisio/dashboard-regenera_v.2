import {COR, el, embrulho} from "./base.js";

function Cabecalho(d) {
  const links = [["valorizacoes", "Valorizações"], ["pessoas", "Pessoas"], ["eixos", "Eixos"], ["espaco", "Contexto espacial"], ["panorama-geral", "Panorama geral"]].map(([id, t]) => {
    const a = el("a", null, t);
    a.href = "#" + id; a.className = "nav-link"; a.dataset.alvo = id;
    return a;
  });
  const nav = el("nav", "display:flex;gap:4px 28px;flex-wrap:wrap", links);
  nav.setAttribute("aria-label", "Seções");

  const marcar = () => {
    let atual = null;
    for (const a of links) {
      const alvo = document.getElementById(a.dataset.alvo);
      if (alvo && alvo.getBoundingClientRect().top < window.innerHeight / 3) atual = a;
    }
    for (const a of links) a.toggleAttribute("aria-current", a === atual);
  };
  addEventListener("scroll", marcar, {passive: true});
  requestAnimationFrame(marcar);
  return el("header", "display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;padding-bottom:18px;border-bottom:1px solid rgba(240,234,216,.14)",
    el("div", "display:flex;align-items:center;gap:14px;flex-wrap:wrap",
      el("div", "font-family:Unbounded,sans-serif;font-weight:800;font-size:18px", "Regenera", el("span", `color:${COR.lima}`, "RS")),
      el("span", `font-size:13px;color:${COR.salvia}`, `Painel de impacto · ciclo ${d.meta.ciclo}`)),
    nav);
}

export const cabecalho = (d) => embrulho(Cabecalho(d));
