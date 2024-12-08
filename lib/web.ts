import { Application, Router } from "jsr:@oak/oak";
import { Eta } from "jsr:@eta-dev/eta";
import {port, publicWebDir, viewsDir} from "./config.ts";
import { Storage } from "../db/storage.ts";

const storage = new Storage();

const eta = new Eta({
  views: viewsDir,
});

const app = new Application();

app.use(async (context, next) => {
  try {
    await context.send({
      root: publicWebDir,
      index: "index.html",
    });
  } catch {
    await next();
  }
});

function getFileName(path: string) {
  return path.split(/[/\\]+/).pop() as string;
}

const downloadables = new Router()
  .get("/", async (context) => {
    const data = {
      code: context.request.url.searchParams.get("code") as string,
      wrongPassword: (context.request.url.searchParams.get("wrongPassword") ||
        false) as boolean,
      reportCode: generateReportCode(),
    };
    context.response.body = await eta.renderAsync("index", data);
  })
  .post("/download", async (context) => {
    const body = await context.request.body.formData();
    const code = body.get("code") as string;
    const reportCode = body.get("reportCode") as string;
    const password = body.get("password") as string;
    const result = await storage.lookupDownloadable(code, password);
    if (result) {
      context.cookies.set(
        `last-successful-download-${reportCode}`,
        `${Date.now()}`,
        { httpOnly: false, maxAge: 60 },
      );
      context.response.headers.set(
        "Content-Disposition",
        `attachment; filename="${(getFileName(result.path))}"`,
      );
      context.response.body = await Deno.readFile(result.path);
    } else {
      context.response.status = 302;
      context.response.headers.set(
        "Location",
        `/?code=${code}&wrongPassword=true`,
      );
      context.response.body =
        "Wrong password, redirecting so you can try again";
    }
  });

app.use(downloadables.routes());
app.use(downloadables.allowedMethods());

app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "Not found";
});

app.addEventListener("error", (evt) => {
  console.error(evt.error);
});

app.addEventListener("listen", ({ hostname, port, secure }) => {
  console.log(`Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
})

export function startServer() {
  app.listen({ port });
}

function generateReportCode() {
  return Math.random().toString(36).substring(2, 15);
}
