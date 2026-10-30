import * as d3 from "d3";
import * as topojson from "topojson-client";
import {Map3D, polygons, spikes, labels} from "@dromerolovo/map3d";
import {COR, nf, x1, el, SEG, ROW, CARD, GROUP, cabecalhoSecao, embrulho} from "./base.js";

const N_RS = 497;
const FLOOD = "rgba(0,24,16,0.55)";
const rgb = (hex) => d3.rgb(hex);
const rgba = (hex, a) => { const c = rgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; };
const PLACES = [
  ["Porto Alegre", -51.2177, -30.0346, 0], ["Santa Maria", -53.8069, -29.6842, 0], ["Pelotas", -52.3426, -31.7654, 0],
  ["Caxias do Sul", -51.1794, -29.1678, 0], ["Passo Fundo", -52.4083, -28.262, 0], ["Lajeado", -51.9644, -29.4669, 1],
  ["Canoas", -51.1794, -29.9178, 1], ["São Leopoldo", -51.1469, -29.7604, 2], ["Eldorado do Sul", -51.3087, -30.0847, 2]
].map(([name, lon, lat, level]) => ({name, lon, lat, level}));
const ZOOM_AT_LEVEL = [0, 1.6, 4];

function Espaco(d, mun, geo) {
  const st = {eixo: "all", proj: null};
  const eixoById = new Map(d.eixos.map((e) => [e.id, e]));
  const projById = new Map(d.projetos.map((p) => [p.id, p]));
  const comLista = d.projetos.filter((p) => mun.mun[p.id]).sort((a, b) => mun.mun[b.id].length - mun.mun[a.id].length);
  const nomes = (ids) => ids.map((id) => projById.get(id)?.nome).filter(Boolean);

  const munis = topojson.feature(geo, geo.objects.municipios);
  const state = topojson.merge(geo, geo.objects.municipios.geometries);
  const mesh = topojson.mesh(geo, geo.objects.municipios, (a, b) => a !== b);
  const ada = topojson.feature(geo, geo.objects.ada);
  const featByCd = new Map(munis.features.map((f) => [f.properties.cd_mun, f]));
  const fc = (cds) => ({type: "FeatureCollection", features: cds.map((cd) => featByCd.get(cd)).filter(Boolean)});

  const projsByMun = new Map();
  for (const p of comLista) for (const cd of mun.mun[p.id]) {
    if (!projsByMun.has(cd)) projsByMun.set(cd, []);
    projsByMun.get(cd).push(p);
  }
  const pontos = [...projsByMun.keys()].map((cd) => {
    const f = featByCd.get(cd), [lon, lat] = d3.geoCentroid(f);
    return {cd, nome: f.properties.nm_mun, lon, lat, projs: projsByMun.get(cd)};
  });
  const MAXP = d3.max(pontos, (m) => m.projs.length);

  const ativos = (m) => st.proj ? m.projs.filter((p) => p.id === st.proj) : st.eixo === "all" ? m.projs : m.projs.filter((p) => p.eixo === st.eixo);
  const corAtual = () => st.proj ? eixoById.get(projById.get(st.proj).eixo).cor : st.eixo === "all" ? COR.lima : eixoById.get(st.eixo).cor;

  const map = new Map3D({
    base: state,
    className: "ce-mapa",
    tooltipClass: "ce-tip",
    ariaLabel: "Mapa do Rio Grande do Sul com os municípios onde os projetos do RegeneraRS atuam",
    height: (w) => w < 640 ? 440 : 600,
    margin: 16,
    zoom: {min: 0.7, max: 40},
    theme: {
      background: ["#005A3C", "#003826"],
      land: "#0b6a48",
      landSide: "#002a1c",
      landStroke: null,
      labelFont: "600 11px Manrope, system-ui, sans-serif",
      labelColor: COR.creme,
      labelBackground: "rgba(0,52,34,0.78)"
    },
    layers: [

      polygons("flood", ada, {fill: FLOOD}),
      polygons("fill", null),
      polygons("mesh", mesh, {stroke: "rgba(240,234,216,0.1)", lineWidth: 0.6}),
      polygons("outline", state, {stroke: "rgba(240,234,216,0.55)", lineWidth: 1.1}),
      polygons("sel", null, {stroke: "rgba(240,234,216,0.9)", lineWidth: 1.3}),
      spikes("munis", pontos, {
        value: (m) => ativos(m).length,
        maxValue: MAXP,
        maxHeight: (w) => w < 640 ? 54 : 80,
        minHeight: 6,
        width: 2.6, maxWidth: 5,
        color: (m) => ativos(m).length ? corAtual() : null,
        glow: (m) => ativos(m).length ? rgba(corAtual(), 0.3) : null,
        z: (m) => ativos(m).length
      }),
      labels("places", PLACES, {minZoom: (p) => ZOOM_AT_LEVEL[p.level]})
    ],
    tooltip: (m) => {
      const ps = ativos(m);
      if (!ps.length) return null;
      const li = ps.map((p) => `<li><i style="background:${eixoById.get(p.eixo).cor}"></i>${p.nome}</li>`).join("");
      return `<b>${m.nome}</b><div class="ce-tn">${ps.length} ${ps.length === 1 ? "projeto" : "projetos"}</div><ul>${li}</ul>`;
    }
  });

  map.element.addEventListener("pointermove", (e) => {
    const tip = map.tooltipElement;
    if (tip.style.opacity !== "1") return;
    const r = map.element.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 8;
    const left = x + gap + tw <= r.width - 8 ? x + gap : Math.max(8, x - gap - tw);
    const top = y - gap - th >= 8 ? y - gap - th : Math.min(r.height - th - 8, y + gap);
    tip.style.left = `${left}px`; tip.style.top = `${top}px`;
  });

  function pintar() {
    const munsAtivos = pontos.filter((m) => ativos(m).length);
    const max = d3.max(munsAtivos, (m) => ativos(m).length) || 1;
    const cor = corAtual();
    const porCd = new Map(munsAtivos.map((m) => [m.cd, ativos(m).length]));
    map.setLayer("fill", {data: fc([...porCd.keys()]), fill: (f) => rgba(cor, st.proj ? 0.6 : 0.3 + 0.45 * (porCd.get(f.properties.cd_mun) / max))});
    map.setData("sel", st.proj ? fc(mun.mun[st.proj]) : null);
    map.render();
    return munsAtivos;
  }

  const filtros = [["all", "Todos"], ...d.eixos.map((e) => [e.id, e.nome])].map(([k, t]) => {
    const b = el("button", null, t);
    b.onclick = () => { st.eixo = k; st.proj = null; render(); map.fitTo("base"); };
    return [k, b];
  });
  const grp = el("div", GROUP("rgba(210,228,132,.2)") + ";flex-wrap:wrap;border-radius:24px", filtros.map((f) => f[1]));
  grp.setAttribute("role", "group"); grp.setAttribute("aria-label", "Eixo");

  const legenda = el("div", `display:flex;gap:8px 18px;flex-wrap:wrap;align-items:center;font-size:12px;color:${COR.palido}`);
  const esquerda = el("div", "flex:3 1 560px;min-width:0;border-radius:30px;background:rgba(0,30,20,.3);border:1px solid rgba(210,228,132,.12);padding:14px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px",
    map.element, el("div", "padding:0 10px 6px;display:flex;flex-direction:column;gap:6px", legenda,
      el("span", "font-size:11.5px;color:rgba(240,234,216,.5)", "arraste para mover · Ctrl + roda (ou pinça) para zoom · passe o mouse num município")));
  map.element.style.borderRadius = "22px";

  const kicker = el("span", `font-size:13px;font-weight:600;color:${COR.salvia}`);
  const total = el("div", `font:800 54px/0.95 Unbounded,sans-serif;letter-spacing:-0.03em;color:${COR.lima}`);
  const frase = el("p", "margin:4px 0 0;font-size:15.5px;line-height:1.45;min-height:3em");

  const linhas = comLista.map((p) => {
    const e = eixoById.get(p.eixo);
    const b = el("button", ROW,
      el("span", "display:flex;justify-content:space-between;gap:10px;width:100%;font-size:15px",
        el("span", "display:flex;align-items:center;gap:10px;font-weight:700", el("span", `flex:none;width:11px;height:11px;border-radius:50%;background:${e.cor}`), p.nome),
        el("span", "font-family:Unbounded,sans-serif;font-size:15px;white-space:nowrap", nf(mun.mun[p.id].length))),
      el("span", `font-size:13px;color:${COR.salvia}`, `${e.nome} · ${p.fase.toLowerCase()}`));
    b.onclick = () => {
      st.proj = st.proj === p.id ? null : p.id;
      render();
      map.fitTo(st.proj ? fc(mun.mun[p.id]) : "base", st.proj ? {pad: mun.mun[p.id].length > 3 ? 0.9 : 0.5} : undefined);
    };
    return {p, b};
  });
  const notaEstado = el("p", `margin:0;padding:10px 12px 0;font-size:12.5px;line-height:1.5;color:${COR.salvia}`);
  const lista = el("div", CARD + "padding:14px;display:flex;flex-direction:column;gap:2px;flex:1 1 0;min-height:260px;overflow:auto",
    linhas.map((l) => l.b), notaEstado);
  const direita = el("div", "flex:2 1 400px;min-width:0;display:flex;flex-direction:column;gap:14px",
    el("div", CARD + "padding:24px;display:flex;flex-direction:column;gap:10px", kicker, total, frase), lista);

  function render() {
    filtros.forEach(([k, b]) => (b.style.cssText = SEG(st.eixo === k)));
    const munsAtivos = pintar();
    const n = munsAtivos.length, cor = corAtual();

    if (st.proj) {
      const p = projById.get(st.proj), e = eixoById.get(p.eixo);
      kicker.textContent = p.nome;
      frase.textContent = `${n === 1 ? "Município" : "Municípios"} onde o projeto atua (${e.nome}, ${p.fase.toLowerCase()}). Clique de novo para voltar.`;
    } else {
      const top = d3.greatest(munsAtivos, (m) => ativos(m).length);
      const nProj = comLista.filter((p) => st.eixo === "all" || p.eixo === st.eixo).length;
      kicker.textContent = st.eixo === "all" ? "Municípios com projeto" : `Municípios com projeto de ${eixoById.get(st.eixo).nome}`;
      frase.textContent = `${x1(100 * n / N_RS)}% dos ${N_RS} municípios do RS, somando ${nProj} ${nProj === 1 ? "projeto" : "projetos"} com lista de municípios.` +
        (top && ativos(top).length > 1 ? ` ${top.nome} reúne mais: ${ativos(top).length}.` : "");
    }
    total.textContent = nf(n);

    for (const {p, b} of linhas) {
      b.style.cssText = ROW + (st.proj === p.id ? "background:rgba(210,228,132,.14)" : "background:transparent");
      b.style.display = st.eixo === "all" || p.eixo === st.eixo ? "flex" : "none";
      b.setAttribute("aria-pressed", st.proj === p.id);
    }
    const est = nomes(mun.estado.filter((id) => st.eixo === "all" || projById.get(id)?.eixo === st.eixo));
    const sem = mun.sem.filter((id) => st.eixo === "all" || projById.get(id)?.eixo === st.eixo).length;
    notaEstado.textContent = [est.length ? `Todo o estado: ${est.join(", ")}.` : "", sem ? `${sem} ${sem === 1 ? "projeto ainda sem" : "projetos ainda sem"} municípios na planilha.` : ""].filter(Boolean).join(" ");

    const sw = (style, txt) => el("span", "display:flex;align-items:center;gap:7px", el("i", style), txt);
    legenda.replaceChildren(
      sw(`display:block;width:3px;height:16px;border-radius:2px;background:${cor};box-shadow:0 0 6px ${rgba(cor, 0.6)}`, "altura = nº de projetos no município"),
      sw(`display:block;width:14px;height:12px;border-radius:3px;background:${rgba(cor, 0.6)}`, st.proj ? "municípios do projeto" : "mais forte = mais projetos"),
      sw(`display:block;width:14px;height:12px;border-radius:3px;box-sizing:border-box;background:${FLOOD}`,"área inundada em 6/5/2024 (UFRGS, bacia do Guaíba)"));
  }
  render();

  return el("section", "display:flex;flex-direction:column;gap:18px",
    cabecalhoSecao("", "Território", grp),
    el("div", "display:flex;flex-wrap:wrap;gap:18px;align-items:stretch", esquerda, direita));
}

export const espaco = (d, mun, geo) => embrulho(Espaco(d, mun, geo));
