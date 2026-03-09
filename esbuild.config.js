const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");
const distDir = path.join(__dirname, "dist");
const cssPath = path.join(__dirname, "ui", "styles.css");

async function buildUI() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, "src", "ui.tsx")],
    bundle: true,
    outfile: path.join(distDir, "ui.js"),
    target: "es2020",
    format: "iife",
    loader: {
      ".tsx": "tsx",
      ".ts": "ts"
    },
    minify: false
  });

  const uiJs = fs.readFileSync(path.join(distDir, "ui.js"), "utf8");
  const uiCss = fs.readFileSync(cssPath, "utf8");
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${uiCss}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${uiJs}</script>
  </body>
</html>`;
  fs.writeFileSync(path.join(distDir, "ui.html"), html, "utf8");
}

async function buildMain() {
  await esbuild.build({
    entryPoints: [path.join(__dirname, "src", "code.ts")],
    bundle: true,
    outfile: path.join(distDir, "code.js"),
    target: "es2020",
    format: "iife",
    minify: false
  });
}

async function run() {
  fs.mkdirSync(distDir, { recursive: true });

  if (!watch) {
    await Promise.all([buildMain(), buildUI()]);
    return;
  }

  const mainCtx = await esbuild.context({
    entryPoints: [path.join(__dirname, "src", "code.ts")],
    bundle: true,
    outfile: path.join(distDir, "code.js"),
    target: "es2020",
    format: "iife"
  });

  const uiCtx = await esbuild.context({
    entryPoints: [path.join(__dirname, "src", "ui.tsx")],
    bundle: true,
    outfile: path.join(distDir, "ui.js"),
    target: "es2020",
    format: "iife"
  });

  await Promise.all([mainCtx.watch(), uiCtx.watch()]);
  await Promise.all([mainCtx.rebuild(), uiCtx.rebuild()]);
  await buildUI();

  fs.watch(cssPath, { persistent: true }, async () => {
    try {
      await buildUI();
      process.stdout.write("[watch] ui rebuilt\n");
    } catch (error) {
      process.stderr.write(`[watch] ui build failed: ${String(error)}\n`);
    }
  });

  process.stdout.write("[watch] build started\n");
}

run().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
