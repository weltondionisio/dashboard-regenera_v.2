import {COR, el, svg, embrulho, cabecalhoSecao} from "./base.js";

const numero = value => value.toLocaleString("pt-BR", {maximumFractionDigits: 2});
const reaisMi = value => `R$ ${numero(value / 1e6)} mi`;

function no(tag, classe, ...filhos) {
  const n = el(tag, null, ...filhos);
  if (classe) n.className = classe;
  return n;
}

function cartao(figura, titulo, subtitulo = "") {
  const n = no("article", "pg-card");
  n.dataset.figura = String(figura);
  n.append(no("h3", "pg-card-title", titulo));
  if (subtitulo) n.append(no("p", "pg-card-subtitle", subtitulo));
  return n;
}

function medidor(valor, maximo, texto = numero(valor)) {
  const valorTexto = no("span", "pg-value", texto);
  const faixa = no("span", "pg-track");
  const preenchimento = no("span", "pg-fill");
  preenchimento.style.width = `${maximo > 0 ? valor / maximo * 100 : 0}%`;
  faixa.setAttribute("aria-hidden", "true");
  faixa.append(preenchimento);
  return no("span", "pg-meter", valorTexto, faixa);
}

function rosca(d) {
  const {deliberado, desembolsado} = d.totais;
  const proporcao = desembolsado / deliberado;
  const diferenca = deliberado - desembolsado;
  const card = cartao(1, "Recursos deliberados e desembolsados");
  const desenho = svg("svg", {viewBox: "0 0 240 240", class: "pg-donut", role: "img", "aria-label": `${reaisMi(desembolsado)} desembolsados de ${reaisMi(deliberado)} deliberados; ${numero(proporcao * 100)}%.`});
  desenho.append(svg("circle", {cx: 120, cy: 120, r: 88, fill: "none", stroke: "rgba(240,234,216,.15)", "stroke-width": 29}));
  desenho.append(svg("circle", {cx: 120, cy: 120, r: 88, fill: "none", stroke: COR.lima, "stroke-width": 29, pathLength: 100, "stroke-dasharray": `${proporcao * 100} 100`, transform: "rotate(-90 120 120)"}));
  const valor = svg("text", {x: 120, y: 115, "text-anchor": "middle", class: "pg-donut-value"});
  valor.textContent = reaisMi(desembolsado);
  const rotulo = svg("text", {x: 120, y: 140, "text-anchor": "middle", class: "pg-donut-label"});
  rotulo.textContent = "desembolsados";
  desenho.append(valor, rotulo);
  const resumo = no("div", "pg-finance-summary",
    no("div", null, no("strong", null, `${numero(proporcao * 100)}%`), no("span", null, "do valor deliberado")),
    no("div", null, no("strong", null, reaisMi(deliberado)), no("span", null, "deliberados")));
  card.append(desenho, resumo, no("p", "pg-footnote", `${reaisMi(diferenca)} de diferença entre deliberado e desembolsado.`));
  return card;
}

function estagios(d) {
  const card = cartao(3, "Estágio dos projetos", `${numero(d.totais.projetos)} projetos apoiados`);
  const maximo = Math.max(...d.estagios.map(s => s.valor));
  const cores = [COR.lima, COR.laranja, COR.salvia];
  const colunas = no("div", "pg-columns");
  d.estagios.forEach((s, i) => {
    const barra = no("span", "pg-column-fill");
    barra.style.height = `${s.valor / maximo * 160}px`;
    barra.style.background = cores[i % cores.length];
    const coluna = no("div", "pg-column",
      no("div", "pg-column-plot", no("span", "pg-column-value", numero(s.valor)), barra),
      no("span", "pg-column-label", s.nome),
      no("span", "pg-column-share", `${(s.valor / d.totais.projetos * 100).toLocaleString("pt-BR", {maximumFractionDigits: 1})}%`));
    coluna.setAttribute("aria-label", `${s.nome}: ${numero(s.valor)} projetos`);
    colunas.append(coluna);
  });
  card.append(colunas);
  return card;
}

function barrasSimples(linhas, cor) {
  const maximo = Math.max(...linhas.map(r => r.valor));
  const lista = no("div", "pg-simple-bars");
  lista.style.setProperty("--axis-color", cor);
  linhas.forEach(r => lista.append(no("div", "pg-simple-row",
    no("span", "pg-simple-label", r.rotulo),
    medidor(r.valor, maximo, r.texto || numero(r.valor)))));
  return lista;
}

function resiliencia(d, cor) {
  const card = cartao(6, "Participação social e planos de contingência", "Soluções Urbanas · municípios");
  card.append(barrasSimples(d.resiliencia, cor), no("p", "pg-footnote", "Preparação e resposta a eventos climáticos extremos."));
  return card;
}

function educacao(d, cor) {
  const card = cartao(7, "Formação e alcance escolar em Educação");
  card.classList.add("pg-education");
  const pessoas = no("div", "pg-education-panel", no("h4", null, "Pessoas"), barrasSimples(d.educacao.formacao, cor));
  const escolas = no("div", "pg-education-panel", no("h4", null, "Escolas"), barrasSimples(d.educacao.escolas, cor));
  card.append(no("div", "pg-education-grid", pessoas, escolas), no("p", "pg-footnote", "Professores capacitados: mais de 8.400. Escolas com equipamentos: 73, beneficiadas com mais de 400 equipamentos."));
  return card;
}

function linhaEixo(eixo, selecionar, ...conteudo) {
  const botao = no("button", "pg-axis-row", ...conteudo);
  botao.type = "button";
  botao.dataset.eixo = eixo.id;
  botao.style.setProperty("--axis-color", eixo.cor);
  botao.setAttribute("aria-label", `Destacar ${eixo.nome}`);
  botao.onclick = () => selecionar(eixo.id);
  return botao;
}

function comparacao(figura, titulo, subtitulo, eixos, medidas, selecionar) {
  const card = cartao(figura, titulo, subtitulo);
  const tabela = no("div", "pg-comparison");
  const cabecalho = no("div", "pg-comparison-head", no("span", null, "Eixo"), ...medidas.map(m => no("span", null, m.nome)));
  tabela.append(cabecalho);
  const maximos = medidas.map(m => Math.max(...eixos.map(e => e[m.campo])));
  eixos.forEach(e => {
    const nome = no("span", "pg-axis-label", no("i", "pg-axis-dot"), e.nome);
    const linha = linhaEixo(e, selecionar, nome, ...medidas.map((m, i) => medidor(e[m.campo], maximos[i], m.formatar(e[m.campo]))));
    linha.classList.add("pg-comparison-row");
    linha.setAttribute("aria-label", `${e.nome}. ${medidas.map(m => `${m.nome}: ${m.formatar(e[m.campo])}`).join(". ")}. Destacar este eixo.`);
    tabela.append(linha);
  });
  card.append(tabela);
  return card;
}

function territorio(d, eixos, selecionar) {
  const card = cartao(5, "Abrangência municipal", `${numero(d.totais.municipios)} municípios no total divulgado`);
  const valores = eixos.filter(e => e.municipios != null);
  const maximo = Math.max(...valores.map(e => e.municipios));
  const lista = no("div", "pg-territory");
  valores.forEach(e => {
    const nome = no("span", "pg-axis-label", no("i", "pg-axis-dot"), no("span", null, e.nome, e.recorteTerritorial ? no("small", null, e.recorteTerritorial) : null));
    const linha = linhaEixo(e, selecionar, nome, medidor(e.municipios, maximo));
    linha.classList.add("pg-territory-row");
    linha.setAttribute("aria-label", `${e.nome}: ${numero(e.municipios)} municípios${e.recorteTerritorial ? `; ${e.recorteTerritorial}` : ""}. Destacar este eixo.`);
    lista.append(linha);
  });
  card.append(lista, no("p", "pg-footnote", "Municípios informados por eixo ou atividade. Uma cidade pode participar de diferentes eixos."));
  return card;
}

function banner(iniciativa, eixo) {
  const card = no("article", "pg-banner");
  card.dataset.iniciativa = iniciativa.id;
  card.dataset.eixo = eixo.id;
  card.style.setProperty("--axis-color", eixo.cor);
  card.append(no("h4", "pg-banner-title", iniciativa.titulo));
  if (iniciativa.recorte) card.append(no("p", "pg-banner-scope", iniciativa.recorte));
  const valores = no("dl", "pg-banner-values");
  iniciativa.indicadores.forEach(i => valores.append(no("div", "pg-indicator", no("dt", null, i.rotulo), no("dd", null, i.texto))));
  card.append(valores);
  if (iniciativa.nota) card.append(no("p", "pg-banner-note", iniciativa.nota));
  return card;
}

function completarBanners(dados) {
  const banners = [...dados.banners];
  // A Figura 8 reúne os resultados de Habitação. O arquivo anterior continha
  // apenas os 18 banners da seção 8, que não tinham um grupo desse eixo.
  if (dados.eixos.some(e => e.id === "hab") && !banners.some(b => b.eixo === "hab")) {
    banners.push({
      id: "habitacao-entregas",
      eixo: "hab",
      titulo: "Entregas e formação em Habitação",
      recorte: "Eixo Habitação · Figura 8 do relatório",
      indicadores: [
        {texto: "Mais de 240", rotulo: "unidades habitacionais em construção ou concluídas", valor: 240},
        {texto: "118", rotulo: "casas entregues", valor: 118},
        {texto: "200", rotulo: "casas com reformas", valor: 200},
        {texto: "615", rotulo: "beneficiários capacitados na construção civil", valor: 615}
      ],
      nota: "Novas unidades habitacionais em 8 municípios."
    });
  }
  return {...dados, banners};
}

function fontes() {
  const detalhes = no("details", "pg-sources");
  detalhes.append(no("summary", null, "Fonte e recortes dos indicadores"),
    no("p", null, "Relatório técnico RegeneraRS: figuras 1 a 8 e indicadores complementares por iniciativa da seção 8. O banner de Habitação apresenta as entregas e a formação da Figura 8. Os valores preservam os números, as unidades e expressões como ‘mais de’ apresentados nessa fonte."),
    no("p", null, "Os banners mantêm o recorte de cada eixo ou iniciativa, inclusive as referências a relatórios anuais e à transparência de 2025. Seus valores são apresentados em seus respectivos recortes, sem somá-los aos totais gerais."),
    no("p", null, "Os recursos deliberados por eixo somam R$ 40,55 milhões nos rótulos divulgados. O total geral informado é R$ 40,5 milhões; as duas apresentações seguem o relatório."));
  return detalhes;
}

export function panoramaGeral(painel, dados) {
  const d = completarBanners(dados);
  const cores = new Map(painel.eixos.map(e => [e.id, e.cor]));
  const eixos = d.eixos.map(e => ({...e, cor: cores.get(e.id) || COR.lima}));
  const porId = new Map(eixos.map(e => [e.id, e]));
  let selecionado = "tudo";
  const secao = no("section", "pg");
  secao.setAttribute("aria-label", "Panorama geral dos resultados divulgados");
  const filtros = no("div", "pg-filters");
  filtros.setAttribute("role", "group");
  filtros.setAttribute("aria-label", "Filtrar o Panorama geral por eixo");
  const botoes = [{id: "tudo", nome: "Tudo", cor: COR.lima}, ...eixos].map(e => {
    const b = no("button", "pg-filter", no("i", "pg-axis-dot"), e.nome);
    b.type = "button";
    b.dataset.eixo = e.id;
    b.style.setProperty("--axis-color", e.cor);
    b.onclick = () => selecionar(e.id);
    filtros.append(b);
    return {eixo: e, botao: b};
  });
  filtros.onkeydown = event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const indice = botoes.findIndex(b => b.botao === document.activeElement);
    if (indice < 0) return;
    event.preventDefault();
    const destino = event.key === "Home" ? 0 : event.key === "End" ? botoes.length - 1 : (indice + (event.key === "ArrowRight" ? 1 : -1) + botoes.length) % botoes.length;
    botoes[destino].botao.focus();
    selecionar(botoes[destino].eixo.id);
  };
  const contexto = no("p", "pg-selection");
  contexto.setAttribute("aria-live", "polite");
  contexto.setAttribute("aria-atomic", "true");
  const topo = no("div", "pg-top");
  const graficos = no("div", "pg-chart-column",
    comparacao(2, "Projetos e recursos por eixo", "Projetos apoiados e recursos deliberados", eixos, [
      {nome: "Projetos", campo: "projetos", formatar: numero},
      {nome: "Deliberado", campo: "deliberado", formatar: reaisMi}
    ], selecionar),
    comparacao(4, "Vidas alcançadas por eixo", `${numero(d.totais.vidasDiretas)} diretas · ${numero(d.totais.vidasIndiretas)} indiretas`, eixos, [
      {nome: "Diretas", campo: "vidasDiretas", formatar: numero},
      {nome: "Indiretas", campo: "vidasIndiretas", formatar: numero}
    ], selecionar),
    territorio(d, eixos, selecionar));
  const banners = no("div", "pg-banner-column");
  const corpo = no("div", "pg-main", graficos, banners);
  secao.append(cabecalhoSecao("Resultados divulgados", "Panorama geral"),
    no("p", "pg-intro", "Explore os resultados e os indicadores por eixo e iniciativa."), filtros, contexto, topo, corpo, fontes());

  function selecionar(id) {
    if (id !== "tudo" && !porId.has(id)) return;
    selecionado = id;
    secao.dataset.eixo = id;
    botoes.forEach(({eixo, botao}) => {
      botao.setAttribute("aria-pressed", String(eixo.id === id));
      botao.classList.toggle("is-muted", id !== "tudo" && eixo.id !== id);
    });
    graficos.querySelectorAll(".pg-axis-row").forEach(linha => {
      linha.classList.toggle("is-muted", id !== "tudo" && linha.dataset.eixo !== id);
      linha.classList.toggle("is-selected", linha.dataset.eixo === id);
      linha.setAttribute("aria-pressed", String(linha.dataset.eixo === id));
    });
    const iniciativas = d.banners.filter(b => id === "tudo" || b.eixo === id);
    const quantidadeIndicadores = iniciativas.reduce((s, b) => s + b.indicadores.length, 0);
    contexto.textContent = `${id === "tudo" ? "Todos os eixos" : porId.get(id).nome}${iniciativas.length ? ` · ${iniciativas.length} ${iniciativas.length === 1 ? "banner" : "banners"} · ${quantidadeIndicadores} indicadores` : " · resultados nos gráficos por eixo"}`;
    topo.replaceChildren(...(id === "tudo" ? [rosca(d), estagios(d), resiliencia(d, porId.get("su").cor)] : id === "edu" ? [educacao(d, porId.get("edu").cor)] : []));
    topo.hidden = !topo.childElementCount;
    topo.classList.toggle("pg-top-education", id === "edu");
    // A ordem anterior era também uma lista de inclusão. Percorrer os eixos
    // cadastrados garante a exibição dos grupos que não constam nessa lista.
    const grupos = eixos.filter(e => id === "tudo" || e.id === id).map(e => {
      const eixo = e.id;
      const itens = iniciativas.filter(b => b.eixo === eixo);
      if (!itens.length) return null;
      const grupo = no("section", "pg-banner-group");
      grupo.dataset.grupo = eixo;
      grupo.style.setProperty("--axis-color", e.cor);
      const grade = no("div", "pg-banners", ...itens.map(b => banner(b, e)));
      if (itens.length === 1) grade.style.gridTemplateColumns = "minmax(0,1fr)";
      grupo.append(no("h3", "pg-group-title", no("i", "pg-axis-dot"), `${e.nome} · ${itens.length} ${itens.length === 1 ? "banner" : "banners"}`), grade);
      return grupo;
    }).filter(Boolean);
    banners.replaceChildren(no("div", "pg-banners-heading", no("p", "pg-kicker", "Resultados em detalhes"), no("h3", null, "Indicadores por eixo e iniciativa")), ...grupos);
    if (!iniciativas.length) banners.append(no("div", "pg-empty", no("h3", null, porId.get(id).nome), no("p", null, "Os resultados deste eixo estão nos gráficos de projetos, recursos, vidas alcançadas e abrangência municipal ao lado.")));
  }

  selecionar(selecionado);
  return embrulho(secao);
}
