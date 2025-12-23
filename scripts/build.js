#!/usr/bin/env node
/* File: scripts/build.js */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// --- CLI Flags ---
const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isWatch = args.includes("--watch");
const isClean = args.includes("--clean");

// --- Paths ---
const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const SRC_DIR = path.join(ROOT_DIR, "src");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

// --- Shared esbuild config ---
const baseConfig = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: isDev,
  minify: !isDev,
  logLevel: "warning",
};

// --- Entry points (name maps to src/{name}.ts -> dist/{name}.js) ---
const entries = [
  "universal-injector",
  "background",
  "popup",
  "overview",
  "onboarding",
];

// --- Static files to copy ---
const staticFiles = [
  "popup.html",
  "popup.css",
  "overview.html",
  "overview.css",
  "onboarding.html",
  "onboarding.css",
  "manifest.json",
];

// --- Helper Functions ---

function cleanDist() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
    console.log("✓ Cleaned dist/");
  }
}

function ensureDistDir() {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
}

function copyFile(src, dest, label) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${label}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to copy ${label}:`, error.message);
    return false;
  }
}

function copyStaticFiles() {
  let success = true;

  // Copy static files from src/
  for (const file of staticFiles) {
    const srcPath = path.join(SRC_DIR, file);
    const destPath = path.join(DIST_DIR, file);
    if (!copyFile(srcPath, destPath, file)) {
      success = false;
    }
  }

  // Copy assets (icons, images)
  if (fs.existsSync(ASSETS_DIR)) {
    const assets = fs.readdirSync(ASSETS_DIR);
    for (const asset of assets) {
      // Skip directories and hidden files
      const srcPath = path.join(ASSETS_DIR, asset);
      if (fs.statSync(srcPath).isDirectory() || asset.startsWith(".")) {
        continue;
      }
      const destPath = path.join(DIST_DIR, asset);
      if (!copyFile(srcPath, destPath, `asset: ${asset}`)) {
        success = false;
      }
    }
  }

  // Copy icon.png from root if it exists
  const rootIcon = path.join(ROOT_DIR, "icon.png");
  if (fs.existsSync(rootIcon)) {
    copyFile(rootIcon, path.join(DIST_DIR, "icon.png"), "icon.png");
  }

  // Copy letta-icon.svg from root if it exists
  const rootSvg = path.join(ROOT_DIR, "letta-icon.svg");
  if (fs.existsSync(rootSvg)) {
    copyFile(rootSvg, path.join(DIST_DIR, "letta-icon.svg"), "letta-icon.svg");
  }

  return success;
}

function getBuildConfigs() {
  return entries.map(name => ({
    ...baseConfig,
    entryPoints: [path.join(SRC_DIR, `${name}.ts`)],
    outfile: path.join(DIST_DIR, `${name}.js`),
  }));
}

// --- Build Functions ---

async function buildOnce() {
  const configs = getBuildConfigs();
  const results = await Promise.all(
    configs.map((config, i) =>
      esbuild
        .build(config)
        .then(() => {
          console.log(`✓ Built ${entries[i]}.js`);
          return { success: true };
        })
        .catch(err => {
          console.error(`✗ Failed to build ${entries[i]}.js:`, err.message);
          return { success: false };
        })
    )
  );

  const failures = results.filter(r => !r.success).length;
  if (failures > 0) {
    throw new Error(`${failures} bundle(s) failed to build`);
  }
}

async function buildWatch() {
  const configs = getBuildConfigs();
  const contexts = await Promise.all(
    configs.map(async (config, i) => {
      const ctx = await esbuild.context({
        ...config,
        plugins: [
          {
            name: "rebuild-notify",
            setup(build) {
              build.onEnd(result => {
                if (result.errors.length === 0) {
                  console.log(`✓ Rebuilt ${entries[i]}.js`);
                }
              });
            },
          },
        ],
      });
      return ctx;
    })
  );

  // Start watching all contexts
  await Promise.all(contexts.map(ctx => ctx.watch()));
  console.log("\n👀 Watching for changes... (Ctrl+C to stop)\n");

  // Keep process alive
  process.on("SIGINT", async () => {
    console.log("\n\nStopping watch mode...");
    await Promise.all(contexts.map(ctx => ctx.dispose()));
    process.exit(0);
  });
}

// --- Main ---

async function main() {
  const startTime = Date.now();

  console.log(`\n🔨 Build mode: ${isDev ? "development" : "production"}${isWatch ? " (watch)" : ""}\n`);

  // Clean if requested
  if (isClean) {
    cleanDist();
  }

  // Ensure dist directory exists
  ensureDistDir();

  try {
    if (isWatch) {
      // Initial build
      await buildOnce();
      copyStaticFiles();
      console.log(`\n✓ Initial build completed in ${Date.now() - startTime}ms`);

      // Start watch mode
      await buildWatch();
    } else {
      // One-time build
      await buildOnce();
      copyStaticFiles();

      const duration = Date.now() - startTime;
      console.log(`\n✓ Build completed in ${duration}ms`);
    }
  } catch (err) {
    console.error(`\n✗ Build failed: ${err.message}`);
    process.exit(1);
  }
}

main();
