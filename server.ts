import http, { IncomingMessage, RequestListener, ServerResponse } from "http";

type RequestMethod = "get" | "post";
type Request = {
  url: string;
  method: RequestMethod;
  headers: Record<string, string | string[] | undefined>;
};

type Response = {
  send: (code: number, content: string) => void;
};

type Handler = (req: Request, res: Response) => void;

type Server = {
  port: number;
  hostname: string;
  start: () => void;
  addRoute: (method: RequestMethod, url: string, handler: Handler) => void;
  addHandler: (handler: Handler) => void;
  addNotFoundHandler: (handler: Handler) => void;
};

const PORT = 8000;
const HOST = "127.0.0.1";

const mapMethod = (method: string | undefined): RequestMethod | undefined => {
  if (method === "GET") {
    return "get";
  }
  if (method === "POST") {
    return "post";
  }
  return undefined;
};

const mapRequest = (req: IncomingMessage): Request | undefined => {
  const method = mapMethod(req.method);
  if (!method) {
    return;
  }

  if (!req.url) {
    return;
  }

  return {
    method,
    url: req.url,
    headers: req.headers,
  };
};

const mapResponse = (res: ServerResponse): Response | undefined => {
  return {
    send: (code, content) => {
      res.writeHead(code, { "content-type": "text/html" });
      res.end(content);
    },
  };
};

const createServer = (port: number, hostname: string): Server => {
  const server = http.createServer();
  const handledUrls: string[] = [];

  const defaultNotFoundHandler: RequestListener = (req, res) => {
    if (!req.url) {
      return;
    }

    if (!handledUrls.includes(req.url)) {
      res.writeHead(404);
      res.end();
    }
  };

  server.on("request", defaultNotFoundHandler);

  const addNotFoundHandler = (handler: Handler) => {
    server.removeListener("request", defaultNotFoundHandler);
    server.on("request", (req, res) => {
      if (!req.url) {
        return;
      }

      if (!handledUrls.includes(req.url)) {
        const mappedRequest = mapRequest(req);
        const mappedResponse = mapResponse(res);

        if (!mappedRequest || !mappedResponse) {
          return;
        }
        handler(mappedRequest, mappedResponse);
      }
    });
  };

  const addHandler = (handler: Handler) => {
    server.on("request", (req, res) => {
      const mappedRequest = mapRequest(req);
      const mappedResponse = mapResponse(res);

      if (!mappedRequest || !mappedResponse) {
        return;
      }
      handler(mappedRequest, mappedResponse);
    });
  };

  const addRoute = (method: RequestMethod, url: string, handler: Handler) => {
    handledUrls.push(url);
    server.on("request", (req, res) => {
      const mappedRequest = mapRequest(req);
      if (!mappedRequest) {
        return;
      }
      if (url !== mappedRequest.url) {
        return;
      }
      if (method !== mappedRequest.method) {
        return;
      }

      const mappedResponse = mapResponse(res);

      if (!mappedRequest || !mappedResponse) {
        return;
      }
      handler(mappedRequest, mappedResponse);
    });
  };

  const start = () => server.listen(port, hostname);

  return {
    port,
    hostname,
    addHandler,
    addRoute,
    addNotFoundHandler,
    start,
  };
};

const server = createServer(PORT, HOST);

server.addHandler((req) => {
  console.log(req.method.toUpperCase() + " " + req.url);
});

server.addRoute("get", "/", (_req, res) => {
  res.send(
    200,
    "<h1>Bienvenue sur le site!!!</h1><p>Ici plein de trucs cools en vrai</p>",
  );
});

server.addRoute("get", "/about", (_req, res) => {
  res.send(200, "<h1>About me</h1><p>Je suis un chill guy</p>");
});

server.addNotFoundHandler((_req, res) => {
  res.send(404, "<h1>Page not found</h1>");
});

server.start();
