# RegeneraRS — Painel de impacto

Dashboard interativo para acompanhar os projetos do RegeneraRS no Rio Grande do Sul. A aplicação reúne indicadores financeiros, vidas alcançadas, entregas por eixo e distribuição territorial dos projetos em uma interface de consulta e exploração dos dados.

**[Acessar a aplicação](https://dashboard-regenera-v-2-9kejbisva-atenea12.vercel.app/#espaco)**

O acesso está sujeito às permissões configuradas na hospedagem da Vercel.

## O que o painel apresenta

- **Valorizações:** valores aprovados pelo Fundo RegeneraRS, previstos nos projetos e mobilizados, com comparações entre projetos e eixos.
- **Pessoas:** vidas alcançadas diretamente e indiretamente, com distribuição por eixo.
- **Eixos:** projetos, estágios de execução e entregas de Educação, Habitação, Soluções Urbanas, Negócios e Projetos Multissetoriais.
- **Contexto espacial:** mapa interativo dos municípios com projetos listados, com seleção por eixo e por projeto.

## Dados e interpretação

Os dados de monitoramento são consolidados em arquivos JSON utilizados pela aplicação. O ciclo de referência aparece no cabeçalho do painel e é definido pelo campo `meta.ciclo` de `painel.json`.

| Arquivo | Conteúdo |
| --- | --- |
| `src/data/painel.json` | Totais, eixos, projetos, valores financeiros, entregas e notas explicativas |
| `src/data/municipios.json` | Vínculos entre projetos e municípios, abrangência estadual e projetos sem lista municipal |
| `src/data/rs.json` | Base geográfica, códigos e nomes municipais utilizados no mapa |

Os indicadores financeiros representam medidas diferentes:

| Indicador | Significado |
| --- | --- |
| Aprovado | Aporte aprovado pelo Fundo RegeneraRS |
| Previsto | Valor total previsto nos projetos |
| Mobilizado | Valor total mobilizado pelos projetos, incluindo o aporte do Fundo |

Essas medidas não equivalem a desembolso. Os valores financeiros são apresentados por projeto e por eixo; os arquivos não informam rateio desses valores por município. A vinculação de um projeto a uma cidade indica presença na lista territorial, sem atribuir a ela todo o orçamento do projeto.

Vidas diretas e indiretas são categorias distintas. Sua soma representa o agregado informado no painel, sem demonstrar uma contagem de pessoas únicas. As notas dos indicadores devem ser consideradas na interpretação das entregas e dos totais.

## Tecnologias

- Observable Framework para organização da página e compilação da aplicação.
- JavaScript e D3.js para componentes e visualizações interativas.
- TopoJSON e `@dromerolovo/map3d` para a representação territorial.
- CSS para identidade visual e adaptação a diferentes tamanhos de tela.
- Vercel para hospedagem.

## Executar localmente

Use Node.js 22 ou superior e npm.

```bash
git clone https://github.com/dromerolovo/dashboard-regenera.git
cd dashboard-regenera
npm ci
npm run dev
```

Abra o endereço informado no terminal pelo Observable. Para gerar a versão compilada:

```bash
npm run build
```

Os arquivos gerados ficam em `dist/`.

## Organização do código

| Caminho | Função |
| --- | --- |
| `src/index.md` | Página principal, importação dos componentes e leitura dos JSONs |
| `src/components/` | Componentes das seções do painel |
| `src/data/` | Dados e base geográfica |
| `src/painel.css` e `src/style.css` | Estilos da aplicação |
| `observablehq.config.js` | Configuração do Observable Framework |
| `package.json` | Dependências e comandos de execução |

Para atualizar os indicadores, revise os JSONs em `src/data/`, mantenha a correspondência entre os identificadores dos projetos e os códigos municipais e gere uma nova compilação.

## Assistente de dados — integração opcional

A integração com Gemini acrescenta um botão flutuante para perguntas sobre os dados do painel. O servidor prepara um catálogo de fatos a partir dos JSONs da aplicação; o modelo seleciona informações desse catálogo, e o servidor valida a seleção antes de apresentar os valores e suas fontes.

A integração exige os componentes do assistente, uma API no servidor e a variável de ambiente `GEMINI_API_KEY`. A chave deve permanecer no servidor. Sua ativação depende da instalação e configuração desses arquivos; a presença deste README não indica que o recurso já esteja habilitado na aplicação publicada.

As instruções completas estão em [LEIA-ME_ASSISTENTE.md](./LEIA-ME_ASSISTENTE.md).

## Repositório

[github.com/dromerolovo/dashboard-regenera](https://github.com/dromerolovo/dashboard-regenera)
