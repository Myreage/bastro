import {
  createServer as createHttpServer,
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from "http";

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

export type Server = {
  port: number;
  hostname: string;
  start: () => void;
  addRoute: (method: RequestMethod, url: string, handler: Handler) => void;
  addHandler: (handler: Handler) => void;
  addNotFoundHandler: (handler: Handler) => void;
};

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
  const server = createHttpServer();
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

  const start = () =>
    server.listen(port, hostname, () =>
      console.log(`Server listening on http://${hostname}:${port}`),
    );

  return {
    port,
    hostname,
    addHandler,
    addRoute,
    addNotFoundHandler,
    start,
  };
};

export { createServer };
