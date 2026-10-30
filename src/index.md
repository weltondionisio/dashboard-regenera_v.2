---
title: Painel RegeneraRS — transversal e eixos
style: painel.css
toc: false
---

```js
import {cabecalho} from "./components/cabecalho.js";
import {valorizacoes} from "./components/valorizacoes.js";
import {pessoas} from "./components/pessoas.js";
import {eixos} from "./components/eixos.js";
import {espaco} from "./components/espaco.js";
import {panoramaGeral} from "./components/panorama.js";
import {assistenteRegenera} from "./components/assistente.js";

const dados = FileAttachment("data/painel.json").json();
const municipios = FileAttachment("data/municipios.json").json();
const rs = FileAttachment("data/rs.json").json();
const dadosPanorama = FileAttachment("data/panorama-geral.json").json();
```

```js
display(cabecalho(dados));
```

<div id="valorizacoes" class="ancora"></div>

```js
display(valorizacoes(dados));
```

<div id="pessoas" class="ancora"></div>

```js
display(pessoas(dados));
```

<div id="eixos" class="ancora"></div>

```js
display(eixos(dados));
```

<div id="espaco" class="ancora"></div>

```js
display(espaco(dados, municipios, rs));
```

<div id="panorama-geral" class="ancora"></div>

```js
display(panoramaGeral(dados, dadosPanorama));
```

```js
const janelaAssistente = assistenteRegenera(dados, municipios, rs);
display(janelaAssistente);
invalidation.then(() => janelaAssistente.destroy());
```

```js
const logoAtenea = await FileAttachment("assets/logo-atenea-latam.png").image({alt: "Grupo Atenea LATAM", width: 30, height: 30});
const rodapeAtenea = document.createElement("footer");
rodapeAtenea.className = "atenea-credit";
const linkAtenea = document.createElement("a");
linkAtenea.href = "https://grupoatenealatam.com/";
linkAtenea.style.cssText = "display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none";
linkAtenea.append("Desenvolvido por Grupo Atenea LATAM", logoAtenea);
rodapeAtenea.append(linkAtenea);
display(rodapeAtenea);
```
