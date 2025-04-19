import { readdirSync, readFile, readFileSync, statSync } from "fs";
import { Server } from "../bserver";

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

export const routeFolder = (
  server: Server,
  rootUrl: string,
  folderPath: string,
) => {
  const allFiles = listAllFiles(folderPath);

  allFiles.forEach((file) => {
    const regex = buildRegex(folderPath);

    const match = file.match(regex);
    const baseUrl = match[1] ?? "";
    const fileName = match[2] ?? "";

    const endUrl =
      fileName === "index.html" ? "" : "/" + fileName.split(".")[0];

    const url = baseUrl + endUrl;
    const page = readFileSync(file, "utf8");

    const route = rootUrl + url;
    server.addRoute("get", route, (_req, res) => {
      res.send(200, page);
    });
  });
};
