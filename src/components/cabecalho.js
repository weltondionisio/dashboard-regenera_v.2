import {COR, el, embrulho} from "./base.js";

function Cabecalho(d) {
  let alturaCabecalho = 0;
  let montado = false;
  let encerrado = false;
  let quadro = null;
  const links = [["valorizacoes", "RegeneraRS em números"], ["pessoas", "Vidas Alcançadas"], ["eixos", "Eixos"], ["espaco", "Território"], ["panorama-geral", "Panorama geral"]].map(([id, t]) => {
    const a = el("a", null, t);
    a.href = "#" + id; a.className = "nav-link"; a.dataset.alvo = id;
    return a;
  });
  const nav = el("nav", "display:flex;gap:4px 28px;flex-wrap:wrap", links);
  nav.setAttribute("aria-label", "Seções");

  const marcar = () => {
    const limite = Math.max(alturaCabecalho + 16, window.innerHeight / 3);
    let atual = null;
    for (const a of links) {
      const alvo = document.getElementById(a.dataset.alvo);
      if (alvo && alvo.getBoundingClientRect().top < limite) atual = a;
    }
    for (const a of links) {
      if (a === atual) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  };
  const header = el("header", "display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px;padding-bottom:18px;border-bottom:1px solid rgba(240,234,216,.14)",
    el("div", "display:flex;align-items:center;gap:14px;flex-wrap:wrap",
      el("div", "font-family:Unbounded,sans-serif;font-weight:800;font-size:18px", "Regenera", el("span", `color:${COR.lima}`, "RS")),
      el("span", `font-size:13px;color:${COR.salvia}`, `Painel de impacto · ciclo ${d.meta.ciclo}`)),
    nav);

  const fixo = el("div", `position:fixed;top:0;left:0;right:0;z-index:1000;background:${COR.verde};box-sizing:border-box;padding:24px clamp(16px,3vw,40px) 0`, header);
  fixo.setAttribute("data-regenera-cabecalho-fixo", "");
  const estilo = el("style", null, `
    #observablehq-main .ancora {
      scroll-margin-top: calc(var(--regenera-altura-cabecalho, 0px) + 16px);
    }
  `);
  const espaco = el("div", "width:100%;min-width:0", estilo, fixo);

  // Reserva a altura real do cabeçalho, inclusive quando o menu quebra linhas.
  const atualizar = () => {
    if (encerrado || !espaco.isConnected) return;
    montado = true;
    alturaCabecalho = Math.ceil(fixo.getBoundingClientRect().height);
    const main = espaco.closest("#observablehq-main");
    const recuoSuperior = main ? parseFloat(window.getComputedStyle(main).paddingTop) || 0 : 0;
    espaco.style.height = `${Math.max(0, alturaCabecalho - recuoSuperior)}px`;
    document.documentElement.style.setProperty("--regenera-altura-cabecalho", `${alturaCabecalho}px`);
    marcar();
  };
  const agendar = () => {
    if (encerrado || quadro !== null) return;
    quadro = requestAnimationFrame(() => {
      quadro = null;
      atualizar();
    });
  };

  const redimensionamento = typeof ResizeObserver === "function" ? new ResizeObserver(agendar) : null;
  redimensionamento?.observe(fixo);

  const limpar = () => {
    if (encerrado) return;
    encerrado = true;
    if (quadro !== null) cancelAnimationFrame(quadro);
    redimensionamento?.disconnect();
    remocao?.disconnect();
    window.removeEventListener("scroll", marcar);
    window.removeEventListener("resize", agendar);
    if (![...document.querySelectorAll("[data-regenera-cabecalho-fixo]")].some(n => n !== fixo)) {
      document.documentElement.style.removeProperty("--regenera-altura-cabecalho");
    }
  };

  // Encerra os observadores se o Framework recriar ou remover esta seção.
  const remocao = typeof MutationObserver === "function" ? new MutationObserver(() => {
    if (espaco.isConnected) {
      if (!montado) agendar();
    } else if (montado) limpar();
  }) : null;
  remocao?.observe(document.body || document.documentElement, {childList: true, subtree: true});

  window.addEventListener("scroll", marcar, {passive: true});
  window.addEventListener("resize", agendar, {passive: true});
  document.fonts?.ready.then(agendar);
  agendar();
  espaco.destroy = limpar;
  return espaco;
}

export const cabecalho = (d) => {
  const conteudo = Cabecalho(d);
  const painel = embrulho(conteudo);
  painel.destroy = conteudo.destroy;
  return painel;
};
