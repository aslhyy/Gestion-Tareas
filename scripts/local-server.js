//local-server.js

const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const { extname, join, normalize } = require("node:path");
const handler = require("../api/index.js");

const publicDir = join(process.cwd(), "public");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  if (req.url.startsWith("/api")) return handler(req, res);
  const pathname = new URL(req.url, "http://localhost").pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = normalize(join(publicDir, requested));
  if (!file.startsWith(publicDir)) {
    res.statusCode = 403;
    return res.end("Forbidden");
  }
  try {
    const content = await readFile(file);
    res.setHeader("Content-Type", `${types[extname(file)] || "application/octet-stream"}; charset=utf-8`);
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(3000, () => console.log("Aplicacion disponible en http://localhost:3000"));
