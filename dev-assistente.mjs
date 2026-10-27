import {createServer} from "node:http";
import {stat} from "node:fs/promises";
import {createReadStream} from "node:fs";
import {resolve, extname, sep} from "node:path";
import assistant from "./api/assistente.js";

// Servidor local da versão compilada; a chave permanece no processo Node.
const root = resolve("dist");
const port = Number(process.env.PORT || 3000);
const mime = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff": "font/woff", ".woff2": "font/woff2", ".map": "application/json"};
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT deve ser uma porta válida.");
try {await stat(resolve(root, "index.html"));} catch {throw new Error("Execute npm run build antes de iniciar este servidor.");}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/assistente") return await assistant(req, res);
    if (!["GET", "HEAD"].includes(req.method)) {res.writeHead(405, {Allow: "GET, HEAD"}); return res.end();}
    const relative = decodeURIComponent(url.pathname);
    const file = resolve(root, "." + (relative === "/" ? "/index.html" : relative));
    if (!file.startsWith(root + sep)) {res.writeHead(403); return res.end("Acesso não permitido.");}
    const info = await stat(file);
    if (!info.isFile()) {res.writeHead(404); return res.end("Arquivo não encontrado.");}
    res.writeHead(200, {"Content-Type": mime[extname(file)] || "application/octet-stream", "Content-Length": info.size, "X-Content-Type-Options": "nosniff"});
    if (req.method === "HEAD") return res.end();
    createReadStream(file).on("error", () => res.destroy()).pipe(res);
  } catch (error) {
    if (!res.headersSent) res.writeHead(error.code === "ENOENT" ? 404 : 400, {"Content-Type": "text/plain; charset=utf-8"});
    res.end("Não foi possível atender a solicitação.");
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Painel e assistente: http://localhost:${port}`));
