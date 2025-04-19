import { readdirSync, readFileSync, statSync } from "fs";
import { createServer, Server } from "../bserver";

const listAllFiles = (folderPath: string): string[] => {
  const items = readdirSync(folderPath);

  return items.flatMap((item) => {
    const isDirectory = statSync(folderPath + "/" + item).isDirectory();

    if (isDirectory) {
      return listAllFiles(folderPath + "/" + item);
    }
    return folderPath + "/" + item;
  });
};

const buildRegex = (folderPath: string): RegExp => {
  const escaped = folderPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?:/(.*?))?/([^/]+)$`);
};

type BastroApp = Server & {
  routeFolder: (rootUrl: string, folderPath: string) => void;
  serveFolder: (rootUrl: string, folderPath: string) => void;
};
export const createBastroApp = (port: number): BastroApp => {
  const server = createServer(port, "localhost");

  const routeFolder = (rootUrl: string, folderPath: string) => {
    const allFiles = listAllFiles(folderPath);

    allFiles.forEach((file) => {
      const regex = buildRegex(folderPath);

      const match = file.match(regex);
      const baseUrl = match[1] ?? "";
      const fileName = match[2] ?? "";

      const endUrl =
        fileName === "index.html" ? "" : "/" + fileName.split(".")[0];

      const url = baseUrl + endUrl;

      const route = rootUrl + url;
      server.addRoute("get", route, (_req, res) => {
        const page = readFileSync(file, "utf8");
        res.send(200, page);
      });
    });
  };

  const serveFolder = (rootUrl: string, folderPath: string) => {
    const allFiles = listAllFiles(folderPath);

    allFiles.forEach((file) => {
      const regex = buildRegex(folderPath);

      const match = file.match(regex);
      const baseUrl = match[1] ?? "";
      const fileName = match[2] ?? "";

      const routeComponents = [
        rootUrl.replace(/\/$/, ""),
        baseUrl,
        fileName,
      ].filter((component) => component);

      const route = routeComponents.join("/");

      server.addRoute("get", route, (_req, res) => {
        const page = readFileSync(file, "utf8");
        res.send(200, page);
      });
    });
  };

  return {
    ...server,
    routeFolder,
    serveFolder,
  };
};
