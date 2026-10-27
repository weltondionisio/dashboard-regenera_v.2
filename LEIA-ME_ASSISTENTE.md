# Assistente RegeneraRS

Implementação preparada para o repositório `dromerolovo/dashboard-regenera`, na revisão `fe4d1783be0097276d2331460a2164d8a99f66c7`, examinada em 27/10/2026.

## O que foi encontrado

O aplicativo usa Observable Framework 1.13.3 e JavaScript/D3. A página é `src/index.md`; não há aplicação Streamlit nem arquivo `app_frontend.py` neste repositório. O exemplo ANTARES precisa ser adaptado a essa estrutura.

Os gráficos recebem os dados de três arquivos:

| Arquivo | Conteúdo utilizado |
| --- | --- |
| `src/data/painel.json` | Ciclo, totais, eixos, projetos, valores e entregas |
| `src/data/municipios.json` | Projetos com listas municipais, abrangência estadual e ausência de lista |
| `src/data/rs.json` | Somente códigos e nomes municipais; a geometria não é enviada ao Gemini |

Na revisão examinada, o painel registra 39 projetos, 5 eixos, 133.722 vidas diretas e **1.076.578 vidas indiretas**. O ciclo é `jul/2026`. O campo `fonte` do arquivo municipal ainda menciona `V2_monitoramento_julho_de_atenea.xlsx`. Essas são características da base atual do aplicativo; esta integração não altera os JSONs nem concilia esses números com relatórios externos.

Há 224 municípios distintos nas listas nominais. Essa contagem não transforma projetos de abrangência estadual em 497 vínculos municipais. A base não apresenta um rateio financeiro por município nem um campo de desembolso. Valores aprovados, previstos e mobilizados mantêm suas definições próprias.

Os dados FINBRA/SICONFI e o relatório fiscal interno não são fontes deste assistente. Se esses dados forem acrescentados futuramente ao aplicativo, a lista de campos permitidos no servidor deverá continuar sendo revisada explicitamente.

## Como a resposta fica restrita à aplicação

O servidor lê os arquivos locais e cria um catálogo de fatos. O Gemini recebe a pergunta, até seis perguntas anteriores e esse catálogo. Sua única saída admitida é uma seleção de identificadores existentes, ou a indicação de que não encontrou dados.

O servidor valida os identificadores e monta a resposta com os textos e valores do próprio catálogo. Textos livres, números redigidos pelo modelo, identificadores inventados e respostas truncadas são recusados. Não são habilitadas ferramentas de busca, execução de código ou consulta externa para produzir fatos.

Essa opção oferece respostas mais controladas e menos livres que um chat convencional. O modelo ainda pode escolher um fato que não seja o mais pertinente à pergunta; a validação garante a origem do conteúdo exibido, não a interpretação perfeita da pergunta. Os cálculos disponíveis são os previamente programados no catálogo. Perguntas que exigem outros cálculos ou dados devem receber a mensagem de ausência de informação.

Cada fato mostra sua fonte. Uma assinatura SHA-256 compara os JSONs carregados pela página com os lidos pelo servidor; se houver divergência de versão, o usuário precisa recarregar a página.

O componente consulta a base completa. Os filtros dos componentes atuais são internos a cada gráfico; por isso, o usuário deve mencionar o eixo, o projeto ou o município na pergunta. O chat não presume que acompanha os filtros visuais ativos.

As perguntas e os fatos do catálogo são enviados à API do Gemini para a seleção. O histórico fica apenas na memória da página, sem `localStorage` nem banco de conversas nesta implementação. Limpar a conversa remove esse histórico local; não equivale à exclusão de registros que o provedor da API eventualmente mantenha.

## Arquivos e locais de integração

Copie as pastas e os arquivos do pacote para a raiz de uma cópia do repositório. A raiz é a pasta que contém `package.json` e `observablehq.config.js`.

| Arquivo | Ação | Função |
| --- | --- | --- |
| `src/components/assistente.js` | Criar | Botão flutuante e janela de conversa |
| `server/assistente-core.js` | Criar | Catálogo, assinatura e validação da seleção |
| `api/assistente.js` | Criar | Endpoint Node que consulta o Gemini |
| `vercel.json` | Criar ou mesclar | Build estático e inclusão dos JSONs na função |
| `.env.example` | Criar | Exemplo sem chave real |
| `dev-assistente.mjs` | Criar | Servidor local da aplicação compilada e da API |
| `tests/assistente.test.js` | Criar | Testes da base, da API e da validação |
| `src/index.md` | Editar | Importar e exibir o componente |
| `package.json` e `package-lock.json` | Mesclar | Node 22 ou superior e scripts de teste e execução |
| `.gitignore` | Acrescentar | Evitar versionar arquivos com a chave |

O pacote inclui os arquivos completos, já integrados à revisão examinada. Em uma revisão posterior, mescle as alterações em vez de substituir arquivos que tenham recebido outras mudanças. Nenhuma publicação ou alteração no repositório remoto foi realizada.

Também está incluído `integracao_assistente.patch`. Como alternativa à cópia manual, na raiz do repositório, execute `git apply --check CAMINHO_DO_PATCH` e, se a conferência passar, `git apply CAMINHO_DO_PATCH`. Use uma única forma de instalação; não aplique o patch depois de já copiar os mesmos arquivos.

### Alteração exata em `src/index.md`

No primeiro bloco JavaScript, junto dos demais imports, acrescente:

```js
import {assistenteRegenera} from "./components/assistente.js";
```

Mantenha as três leituras existentes:

```js
const dados = FileAttachment("data/painel.json").json();
const municipios = FileAttachment("data/municipios.json").json();
const rs = FileAttachment("data/rs.json").json();
```

Depois do bloco que contém `display(espaco(dados, municipios, rs));`, acrescente **um novo bloco JavaScript**:

````md
```js
const janelaAssistente = assistenteRegenera(dados, municipios, rs);
display(janelaAssistente);
invalidation.then(() => janelaAssistente.destroy());
```
````

Não junte esse trecho ao bloco de imports e leitura dos JSONs: o Observable resolve as dependências entre os blocos. O botão aparecerá fixo no canto inferior direito, com as cores já usadas no dashboard. A janela pode ser fechada pelo botão, pela tecla Escape ou pelo fundo externo.

### Alterações de configuração

Em `package.json`, acrescente os scripts abaixo e defina `engines.node` como `>=22`:

```json
"preview:assistente": "node --env-file=.env.local dev-assistente.mjs",
"test:assistente": "node --test tests/assistente.test.js"
```

O arquivo completo está no pacote. Não é necessário instalar o SDK do Gemini: a chamada REST usa o `fetch` do Node. O `package-lock.json` fornecido acompanha a mudança do requisito de Node e mantém as versões de dependências.

Acrescente a `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

## Configurar a Vercel

1. Inclua os arquivos na cópia do projeto e mantenha `vercel.json` na raiz.
2. Nas configurações do projeto da Vercel, em **Environment Variables**, cadastre `GEMINI_API_KEY` com a chave da API do Google. Cadastre nos ambientes em que o assistente será usado.
3. Opcionalmente, cadastre `GEMINI_MODEL`. O padrão configurado é `gemini-3.5-flash-lite`, um identificador estável documentado pelo Google na data da revisão. O modelo precisa estar disponível para a chave e aceitar saída estruturada JSON.
4. Use Node 22 ou superior. O comando de build é `npm run build`, o diretório de saída é `dist`, e o preset fica em **Other**. O `vercel.json` já declara a compilação e a função.
5. Faça um novo deploy para aplicar os arquivos e as variáveis. Confira o botão e consulte, por exemplo, “Qual o valor mobilizado no eixo Educação?”.

A chave fica exclusivamente no processo do servidor, nunca em `src`, `dist`, no componente JavaScript ou no `FileAttachment`. A função em `/api/assistente` é necessária: publicar somente a pasta estática `dist` em uma hospedagem sem funções Node não ativa o chat.

## Executar localmente

Na raiz do projeto, use Node 22 ou superior. Crie `.env.local` a partir de `.env.example` e substitua o texto de exemplo pela chave real:

```dotenv
GEMINI_API_KEY=COLOQUE_SUA_CHAVE_AQUI
GEMINI_MODEL=gemini-3.5-flash-lite
```

Execute:

```bash
npm ci
npm run test:assistente
npm run build
npm run preview:assistente
```

Abra `http://localhost:3000`. O comando funciona também em Windows com Node 22 ou superior. Após alterar os JSONs, compile novamente e reinicie o servidor local.

O comando original `npm run dev` inicia a prévia do Observable, mas não a API. Para testar o chat completo, use `preview:assistente` após o build, ou a prévia de deploy da Vercel.

## Conferência realizada

- Build do Observable concluído com o componente integrado.
- 15 testes automatizados com chamadas ao Gemini simuladas: totais, dados ausentes, vínculos municipais, assinatura da versão, restrição de campos, esquema da resposta, chave ausente, histórico, origem, limite de tamanho, timeout e erros do provedor.
- Verificação funcional do componente em DOM simulado: abertura, fechamento, envio, fontes, assinatura da versão, limpeza, cancelamento e exibição de texto sem execução de HTML. Não foi uma inspeção visual em navegador.
- Verificação HTTP da página compilada e da API pelo servidor local; arquivos fora de `dist` não são servidos como conteúdo estático.
- Os JSONs de origem foram preservados.

Não foi feita uma consulta real ao Gemini: é necessária a chave do responsável pelo projeto. Portanto, a qualidade da seleção semântica pelo modelo, a habilitação da chave e a implantação na conta da Vercel precisam ser conferidas no ambiente do projeto.

## Referências técnicas

- Observable Framework: https://observablehq.github.io/framework/javascript
- Gemini: https://ai.google.dev/gemini-api/docs/api-key
- Saída estruturada: https://ai.google.dev/gemini-api/docs/structured-output
- Modelo configurado: https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite
- Vercel Node: https://vercel.com/docs/functions/runtimes/node-js
- Configuração Vercel: https://vercel.com/docs/project-configuration/vercel-json
