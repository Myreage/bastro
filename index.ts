import { createBastroApp } from "./lib/bastro";

const PORT = 8000;

const app = createBastroApp(PORT);

app.addHandler((req) => {
  console.log(req.method.toUpperCase() + " " + req.url);
});

app.addNotFoundHandler((_req, res) => {
  res.send(404, "<h1>Page not found</h1>");
});

app.routeFolder("/", "./public/pages");
app.serveFolder("/styles", "./public/styles");

app.start();
