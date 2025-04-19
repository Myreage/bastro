import { readFile, readFileSync } from "fs";
import { createServer } from "./lib/bserver";
import { routeFolder } from "./lib/bastro";

const PORT = 8000;
const HOST = "127.0.0.1";

const server = createServer(PORT, HOST);

server.addHandler((req) => {
  console.log(req.method.toUpperCase() + " " + req.url);
});

server.addNotFoundHandler((_req, res) => {
  res.send(404, "<h1>Page not found</h1>");
});

routeFolder(server, "/", "./pages");

server.start();
