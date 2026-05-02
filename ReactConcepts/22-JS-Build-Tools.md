# JavaScript Build Tools — Complete Guide

---

## Table of Contents

1. [Why Build Tools Exist](#1-why-build-tools-exist)
2. [What Happens Inside a Build Tool](#2-what-happens-inside-a-build-tool)
3. [The Landscape — Tool Categories](#3-the-landscape--tool-categories)
4. [Webpack](#4-webpack)
5. [Vite](#5-vite)
6. [Rollup](#6-rollup)
7. [esbuild](#7-esbuild)
8. [Parcel](#8-parcel)
9. [Turbopack](#9-turbopack)
10. [SWC — The Compiler](#10-swc--the-compiler)
11. [Babel — The Original Transpiler](#11-babel--the-original-transpiler)
12. [Tool Comparison Matrix](#12-tool-comparison-matrix)
13. [How to Choose](#13-how-to-choose)
14. [Configuration Deep-Dives](#14-configuration-deep-dives)
15. [Concepts Every Developer Must Know](#15-concepts-every-developer-must-know)
16. [Q&A — Interview Prep](#16-qa--interview-prep)

---

## 1. Why Build Tools Exist

Modern JavaScript cannot be shipped directly to the browser as-is. Several gaps exist between what developers write and what browsers understand:

```
What developers write           What browsers need
─────────────────────           ──────────────────
TypeScript                  →   Plain JavaScript
JSX                         →   React.createElement() calls
ES2022+ syntax              →   ES5 (for older browsers) or targeted ES version
import/export (ESM)         →   <script> tags or CommonJS in some environments
CSS Modules / SCSS          →   Plain CSS
hundreds of small files     →   Few optimized bundles (fewer network requests)
node_modules imports        →   Resolved file paths, tree-shaken output
```

Build tools bridge this gap. Their job:

1. **Resolve** — find every imported file/module
2. **Transform** — compile TS, JSX, SCSS, etc. into browser-compatible output
3. **Bundle** — combine modules into fewer output files
4. **Optimize** — minify, tree-shake dead code, split chunks for lazy loading
5. **Serve** — provide a fast dev server with Hot Module Replacement (HMR)

---

## 2. What Happens Inside a Build Tool

Understanding the internal pipeline helps you debug and configure any tool.

### The core pipeline

```
Source Files
    │
    ▼
┌─────────────────────────────────────┐
│  1. ENTRY POINT RESOLUTION          │
│  Start from index.tsx / main.js     │
│  Build a dependency graph           │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  2. MODULE GRAPH TRAVERSAL          │
│  Follow every import recursively    │
│  Collect all modules                │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  3. TRANSFORM (per file)            │
│  TypeScript → JS (tsc / SWC)        │
│  JSX → React.createElement          │
│  SCSS → CSS                         │
│  Modern JS → target syntax (Babel)  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  4. BUNDLE                          │
│  Merge modules into chunks          │
│  Apply code splitting rules         │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  5. OPTIMIZE                        │
│  Tree-shake (dead code elimination) │
│  Minify JS (Terser / esbuild)       │
│  Minify CSS                         │
│  Scope hoist (flatten module wrappers)│
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  6. OUTPUT                          │
│  Write dist/ files                  │
│  Generate sourcemaps                │
│  Write manifest / asset hashes      │
└─────────────────────────────────────┘
```

### Key internal concepts

**Module graph** — a directed acyclic graph (DAG) where each node is a file and each edge is an `import`. The bundler traverses this graph depth-first from the entry point.

**Chunk** — a group of modules that will be output as a single file. Code splitting creates multiple chunks (one per lazy-loaded route, shared vendor chunk, etc.).

**Tree shaking** — dead code elimination. If a module exports `A` and `B` but only `A` is imported anywhere, `B` is excluded from the output. Only works reliably with **static ES module imports** (`import`/`export`), not `require()`.

**HMR (Hot Module Replacement)** — in dev mode, when a file changes, only that module (and its dependents) is replaced in the running browser page — without a full reload and without losing component state.

---

## 3. The Landscape — Tool Categories

Not all tools do the same thing. It helps to understand the layers:

```
┌────────────────────────────────────────────────────────┐
│                   Build Frameworks                      │
│  (opinionated, full setup: dev server + bundler + HMR) │
│         Vite,  Parcel,  create-react-app (CRA)         │
└────────────────────────────────────────────────────────┘
                         built on
┌────────────────────────────────────────────────────────┐
│                     Bundlers                           │
│  (assemble modules into output bundles)                │
│         Webpack,  Rollup,  esbuild,  Turbopack         │
└────────────────────────────────────────────────────────┘
                         built on
┌────────────────────────────────────────────────────────┐
│              Transpilers / Compilers                   │
│  (transform one syntax to another)                     │
│              Babel,  SWC,  tsc                         │
└────────────────────────────────────────────────────────┘
```

In practice:

- **Vite** uses **Rollup** for production builds and **esbuild** for dev-time pre-bundling
- **CRA** uses **Webpack** under the hood
- Modern setups replace **Babel** with **SWC** for speed

---

## 4. Webpack

### What

The **most battle-tested bundler**. Powers CRA, Next.js (pre-v13), Angular CLI, and countless enterprise apps. Everything is configured explicitly — there is no magic.

**Released:** 2012 | **Written in:** JavaScript | **Language:** Node.js

### How it works internally

```
1. Start from entry (e.g., src/index.tsx)
2. Parse file → extract all require()/import statements
3. For each import → resolve file path → apply matching loaders → parse that file
4. Build a module graph (all files as nodes)
5. Apply plugins at various lifecycle hooks (emit, compilation, chunk)
6. Group modules into chunks based on splitChunks config
7. Write output files (JS, CSS, assets) with content hashes
```

Webpack processes everything through **loaders** (per-file transforms) and **plugins** (compilation-wide hooks).

```
Loader pipeline (right to left):
file.tsx → ts-loader → babel-loader → result JS string → webpack module
```

### Core concepts

```
Entry      → where Webpack starts building the graph
Output     → where and how to write the bundles
Loaders    → per-file transformers (ts-loader, css-loader, file-loader)
Plugins    → hooks into the compilation lifecycle (HtmlWebpackPlugin, MiniCssExtractPlugin)
Mode       → 'development' | 'production' | 'none' (presets for optimization)
```

### Configuration

```js
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'production',

	// 1. Entry point
	entry: './src/index.tsx',

	// 2. Output
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].[contenthash].js', // content hash for cache busting
		clean: true, // remove old dist on each build
	},

	// 3. Resolve — how to find modules
	resolve: {
		extensions: ['.tsx', '.ts', '.js'], // try these extensions
		alias: {
			'@': path.resolve(__dirname, 'src'), // @ → ./src
		},
	},

	// 4. Loaders — transform files before bundling
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader, // extract CSS to separate file
					'css-loader', // resolve @import, url()
					'sass-loader', // compile SCSS → CSS
				],
			},
			{
				test: /\.(png|jpg|svg)$/,
				type: 'asset/resource', // copy to output dir
			},
		],
	},

	// 5. Plugins
	plugins: [
		new HtmlWebpackPlugin({ template: './index.html' }),
		new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
	],

	// 6. Code splitting
	optimization: {
		splitChunks: {
			chunks: 'all', // split vendor code into a separate chunk
			cacheGroups: {
				vendor: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all',
				},
			},
		},
	},
};
```

### Dev server

```js
// webpack.config.js — devServer section
devServer: {
  port: 3000,
  hot: true,          // HMR
  historyApiFallback: true,  // SPA routing
  proxy: {
    '/api': 'http://localhost:4000',
  },
},
```

### When to use Webpack

- You need granular control over every aspect of the build
- You're maintaining a large existing codebase already using Webpack
- You need advanced code splitting, Module Federation, or complex caching strategies
- Your team is experienced with its ecosystem (loaders, plugins)

### Weakness

- Extremely slow cold starts and rebuilds (all transforms in JS on a single thread)
- Configuration is verbose and error-prone
- Large `node_modules` traversal is slow

---

## 5. Vite

### What

A **next-generation dev server and build tool** that uses native browser ES modules in development — completely bypassing bundling during dev. Production builds use Rollup.

**Released:** 2020 | **Creator:** Evan You (Vue.js) | **Written in:** TypeScript + Go (via esbuild)

### How it works internally

**Dev mode (the key innovation):**

```
Traditional bundler dev server:
  Change file → re-bundle everything → serve bundle → browser reloads
  (can take 10–60 seconds for large apps)

Vite dev server:
  Browser requests /src/App.tsx?
    → Vite transforms ONLY that file on demand
    → returns native ES module
    → browser imports its dependencies (which Vite transforms on demand too)

  Change file → Vite transforms only that file + its direct dependents
    → sends HMR update via WebSocket → browser hot-replaces just that module
  (milliseconds regardless of app size)
```

Vite achieves this by serving files as **native ES modules** directly to the browser. The browser handles the import graph — Vite is just a transformation server.

**Production mode:**

```
Vite uses Rollup for production builds
  → Rollup produces highly optimized, tree-shaken bundles
  → esbuild used for minification (faster than Terser)
```

**Pre-bundling (one-time on first start):**

```
node_modules (CommonJS) → esbuild converts to ESM → cached in .vite/
  → subsequent starts skip this step (uses cache)
  → also merges many small module files into one (reduces HTTP requests in dev)
```

### Configuration

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';

// JSX + Fast Refresh
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		react(), // uses SWC internally (@vitejs/plugin-react-swc) or Babel
	],

	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},

	// Dev server options
	server: {
		port: 3000,
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true,
			},
		},
	},

	// Production build (Rollup options)
	build: {
		outDir: 'dist',
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'], // split React into its own chunk
				},
			},
		},
	},

	// CSS
	css: {
		modules: {
			localsConvention: 'camelCase',
		},
		preprocessorOptions: {
			scss: {
				additionalData: `@use "@/styles/variables" as *;`,
			},
		},
	},
});
```

### Environment variables

```
.env                  → loaded always
.env.development      → loaded in dev only
.env.production       → loaded in production only

# Prefix with VITE_ to expose to client code:
VITE_API_URL=https://api.example.com

# Access in code:
import.meta.env.VITE_API_URL
import.meta.env.MODE          // 'development' | 'production'
import.meta.env.DEV           // boolean
import.meta.env.PROD          // boolean
```

### When to use Vite

- New React / Vue / Svelte / vanilla JS projects
- Any project where developer experience (dev server speed) matters
- Library development (first-class library mode)
- You want sensible defaults without complex configuration

### This project uses Vite

```ts
// vite.config.ts in gold-invest
// Uses @vitejs/plugin-react for JSX
// Uses Module Federation (@originjs/vite-plugin-federation)
// Build output → dist/
```

---

## 6. Rollup

### What

A **library-first bundler** focused on producing clean, optimized ES module output. Invented tree shaking. Used by Vite internally for production builds.

**Released:** 2015 | **Written in:** JavaScript → now Rust (via Rolldown, the successor)

### How it works internally

```
1. Parse all modules into AST (Abstract Syntax Tree)
2. Statically analyze import/export bindings
3. Build an import graph
4. Tree-shake: mark which exports are actually used
5. "Scope hoist" — flatten all modules into one scope (no wrapper functions)
6. Output clean, minimal ES module bundles
```

**Scope hoisting** is Rollup's killer feature for libraries:

```js
// Input: two modules
// math.js
export const add = (a, b) => a + b;
export const multiply = (a, b) => a * b;  // never imported

// main.js
import { add } from './math.js';
console.log(add(1, 2));

// Rollup output (no wrappers, no module boilerplate):
const add = (a, b) => a + b;
console.log(add(1, 2));
// multiply is gone (tree-shaken) ✓
```

Compare with Webpack's output which wraps every module in a factory function — Rollup's output is much smaller.

### Configuration

```js
// rollup.config.js
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

export default {
	input: 'src/index.ts',

	output: [
		// ESM for tree-shaking by consumers
		{
			file: 'dist/index.esm.js',
			format: 'es',
			sourcemap: true,
		},
		// CommonJS for Node.js consumers
		{
			file: 'dist/index.cjs.js',
			format: 'cjs',
			sourcemap: true,
		},
	],

	plugins: [
		resolve(), // resolve node_modules
		commonjs(), // convert CJS dependencies to ESM
		typescript(),
		terser(), // minify
	],

	// Don't bundle peer dependencies (React, etc.)
	external: ['react', 'react-dom'],
};
```

### When to use Rollup

- Building a **library** (component library, utility package, SDK)
- You need multiple output formats (ESM + CJS + UMD)
- You want the cleanest, smallest possible output
- Building the design system (`@bharatpe/invest-bharatpe-ui` is likely built with Rollup or a similar tool)

### When NOT to use Rollup for apps

Rollup lacks a mature dev server and HMR — use Vite (which uses Rollup internally) for applications.

---

## 7. esbuild

### What

An **extremely fast bundler and transpiler** written in Go. 10–100× faster than JavaScript-based tools. Not a full replacement for Webpack/Rollup (missing some features) but used as the speed engine inside Vite and other tools.

**Released:** 2020 | **Written in:** Go | **Creator:** Evan Wallace (Figma)

### Why is it fast?

```
JavaScript-based tools (Webpack, Babel):
  - Run in Node.js (single-threaded JS engine)
  - Parse AST in JavaScript
  - Each transformation is a JS function call
  - Sequential transforms for each file

esbuild (Go):
  - Compiled native binary
  - Multi-threaded (parses and transforms files in parallel)
  - Shares memory between threads (no serialization overhead)
  - All passes (parse, link, transform, codegen) in a single pass where possible
  - 10–100× faster in benchmarks
```

### How it works internally

```
1. Parse all files in parallel (Go goroutines)
2. Build module graph
3. Apply transforms (TS, JSX → JS) in the same pass as parsing
4. Bundle (link) all modules
5. Minify (optional)
6. Write output
```

esbuild does everything in **one pass** where possible, while tools like Babel do multiple AST passes.

### Using esbuild directly

```js
// build.mjs
import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/index.tsx'],
	bundle: true,
	outfile: 'dist/bundle.js',
	format: 'esm',
	target: ['chrome90', 'firefox88', 'safari14'],
	minify: true,
	sourcemap: true,
	define: {
		'process.env.NODE_ENV': '"production"',
	},
	loader: {
		'.svg': 'dataurl', // inline SVGs as data URLs
		'.png': 'file', // copy PNG files
	},
});
```

### esbuild as a Vite plugin

```ts
// vite.config.ts — esbuild options
export default defineConfig({
	esbuild: {
		target: 'es2020', // syntax target for esbuild's transpilation
		jsxInject: `import React from 'react'`, // auto-import React
	},
	build: {
		minifier: 'esbuild', // use esbuild to minify (default in Vite)
	},
});
```

### Limitations of esbuild

- No TypeScript **type checking** (strips types but does not check them — run `tsc --noEmit` separately)
- Limited plugin API (less extensible than Webpack/Rollup)
- No support for some advanced Webpack features (Module Federation, complex code splitting)
- CSS handling is basic (no CSS Modules natively, no SCSS without plugins)

### When to use esbuild directly

- Building simple scripts or CLIs
- As the fast transform layer inside another tool (Vite uses it this way)
- When build speed is the top priority and you don't need advanced features

---

## 8. Parcel

### What

A **zero-configuration bundler** — point it at an HTML file and it figures out everything automatically: TS, JSX, SCSS, images, fonts, code splitting.

**Released:** 2017 | **Written in:** Rust (Parcel 2)

### How it works internally

```
1. Start from index.html
2. Find <script>, <link>, <img> tags → those are the entry assets
3. For each asset: detect type → apply built-in transformer
4. Follow imports recursively
5. Apply optimizations
6. Output to dist/
```

Parcel uses a **content-addressable cache** — every file is hashed, and its compiled output is stored keyed by that hash. On the next build, only changed files are recompiled. This makes subsequent builds extremely fast.

### Usage

```bash
# Install
npm install --save-dev parcel

# Dev server — just point at index.html
npx parcel index.html

# Production build
npx parcel build index.html
```

Zero configuration needed. Parcel auto-detects:

- TypeScript (installs `@parcel/transformer-typescript-tsc` automatically)
- SCSS (installs `sass` automatically)
- React/JSX
- CSS Modules

```html
<!-- index.html — this is your "config" -->
<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" href="./src/styles/index.scss" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="./src/index.tsx"></script>
	</body>
</html>
```

### When to use Parcel

- Prototypes, hackathons, learning projects
- Small to medium apps where you don't want to think about configuration
- Teams that want to move fast without a dedicated build engineer

### When NOT to use Parcel

- Large enterprise projects needing fine-grained control over code splitting
- Module Federation (not well supported)
- Teams with existing Webpack/Vite expertise

---

## 9. Turbopack

### What

The **Webpack successor** built by Vercel, written in Rust. Designed to replace Webpack inside Next.js. Currently in active development (stable in Next.js 14+ for dev, production build support added in Next.js 15).

**Released:** 2022 (beta) | **Written in:** Rust

### How it works internally

Turbopack introduces **incremental computation** via a concept called "Turbo Engine":

```
Traditional bundler: rebuild from scratch when files change

Turbopack:
  Every computation is a function: f(inputs) → output
  Inputs and outputs are cached with their hash
  When a file changes:
    → only functions whose inputs changed are recomputed
    → all other outputs are reused from cache
    → change propagation is tracked at the function level, not the file level
```

This is similar to how build systems like Bazel or Buck work — fine-grained dependency tracking.

### When to use Turbopack

- Next.js 14+ apps (it's becoming the default dev server)
- When you need Webpack-level ecosystem compatibility with near-Vite speeds

### Current status (2026)

- Dev mode: stable in Next.js 14+
- Production builds: available in Next.js 15
- Not yet available as a standalone bundler outside Next.js

---

## 10. SWC — The Compiler

### What

**Speedy Web Compiler** — a Rust-based compiler that replaces Babel. Transforms TypeScript, JSX, and modern JS syntax. Does NOT bundle (it's a compiler, not a bundler).

**Released:** 2019 | **Written in:** Rust | **Creator:** DongYoon Kang

### How it works

```
Source file (TS/JSX)
    │
    ▼
SWC parser → AST (parsed in Rust, ~20× faster than Babel)
    │
    ▼
SWC transformer → applies transforms (JSX → createElement, TS → JS, decorators, etc.)
    │
    ▼
SWC codegen → outputs JavaScript string
```

SWC performs the same job as Babel but **in Rust**, making it 20–70× faster.

### Used by

- **Vite** — `@vitejs/plugin-react-swc` (opt-in, replaces Babel)
- **Next.js** — replaced Babel entirely in Next.js 12+
- **Turbopack** — uses SWC for transforms
- **Parcel 2** — uses SWC

### Usage as a standalone compiler

```js
// .swcrc
{
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "tsx": true,
      "decorators": true
    },
    "transform": {
      "react": {
        "runtime": "automatic"  // auto-import React (React 17+ JSX transform)
      }
    },
    "target": "es2020"
  },
  "module": {
    "type": "es6"
  }
}
```

```bash
npx swc src/index.tsx -o dist/index.js
```

### SWC vs Babel

|                    | Babel                          | SWC                            |
| ------------------ | ------------------------------ | ------------------------------ |
| Language           | JavaScript                     | Rust                           |
| Speed              | Baseline                       | 20–70× faster                  |
| Plugin ecosystem   | Huge (years of plugins)        | Smaller but growing            |
| TypeScript support | Via `@babel/preset-typescript` | Native                         |
| Custom transforms  | Very flexible                  | More limited                   |
| Used by            | Legacy projects                | Next.js, Vite (opt-in), Parcel |

---

## 11. Babel — The Original Transpiler

### What

The JavaScript compiler that made modern JS development possible. Transforms ES2015+ (arrow functions, classes, destructuring, async/await) to ES5 for older browsers. Also handles JSX and TypeScript (type stripping only).

**Released:** 2014 | **Written in:** JavaScript

### How it works internally

```
Source code
    │
    ▼
@babel/parser → AST (Abstract Syntax Tree)
    │             e.g. ArrowFunctionExpression node
    ▼
@babel/traverse → visits every AST node
    │             plugins register visitors for specific node types
    ▼
@babel/generator → generates new code from the modified AST
    │
    ▼
Output JavaScript
```

Each Babel **plugin** transforms one specific syntax feature. A **preset** is a curated bundle of plugins:

```
@babel/preset-env    → all modern JS → target browsers
@babel/preset-react  → JSX → createElement
@babel/preset-typescript → TypeScript → JS (type stripping only)
```

### Configuration

```json
// babel.config.json
{
	"presets": [
		[
			"@babel/preset-env",
			{
				"targets": "> 0.5%, last 2 versions, not dead",
				"useBuiltIns": "usage", // auto-add polyfills based on usage
				"corejs": 3
			}
		],
		[
			"@babel/preset-react",
			{ "runtime": "automatic" } // no need to import React in every file
		],
		"@babel/preset-typescript"
	],
	"plugins": ["@babel/plugin-proposal-decorators"]
}
```

### When to use Babel

- You need a specific Babel plugin that SWC doesn't support
- Maintaining a legacy project already deeply configured with Babel
- You need extremely fine-grained control over code transforms

### When to prefer SWC over Babel

Almost always in new projects. SWC is a drop-in replacement for the most common Babel presets, and it's dramatically faster.

---

## 12. Tool Comparison Matrix

|                       | Webpack            | Vite                  | Rollup          | esbuild                | Parcel                  |
| --------------------- | ------------------ | --------------------- | --------------- | ---------------------- | ----------------------- |
| **Primary use**       | App bundler        | App build tool        | Library bundler | Fast compiler/bundler  | Zero-config app bundler |
| **Written in**        | JS                 | TS+Go+Rust            | JS→Rust         | Go                     | Rust                    |
| **Dev server**        | ✅ (slow)          | ✅ (fast, native ESM) | ❌              | ❌                     | ✅                      |
| **HMR**               | ✅                 | ✅ (fast)             | ❌              | ❌                     | ✅                      |
| **Config required**   | Lots               | Minimal               | Moderate        | Minimal                | None                    |
| **Tree shaking**      | ✅                 | ✅ (Rollup)           | ✅ (best)       | ✅                     | ✅                      |
| **Code splitting**    | ✅ (advanced)      | ✅                    | Limited         | Limited                | ✅                      |
| **Module Federation** | ✅                 | ✅ (plugin)           | ❌              | ❌                     | ❌                      |
| **Library output**    | Possible           | ✅ (lib mode)         | ✅ (best)       | Limited                | Limited                 |
| **TypeScript**        | Via loader         | Native (SWC/esbuild)  | Via plugin      | Native (no type check) | Native                  |
| **CSS Modules**       | Via loader         | ✅ native             | Via plugin      | Limited                | ✅ native               |
| **Build speed**       | Slow               | Fast (Rollup prod)    | Medium          | Very fast              | Fast (Rust)             |
| **Dev speed**         | Slow               | Very fast             | N/A             | Very fast              | Fast                    |
| **Plugin ecosystem**  | Huge               | Large                 | Large           | Small                  | Medium                  |
| **Best for**          | Large apps, legacy | New apps              | Libraries       | CI scripts, speed      | Prototypes              |

---

## 13. How to Choose

```
Are you building a library / npm package?
  └─ YES → Rollup (or Vite in library mode)
  └─ NO
      │
      Is it a Next.js app?
        ├─ YES → Turbopack (built-in, no choice needed)
        └─ NO
            │
            Do you need extreme config control or Module Federation?
              ├─ YES → Webpack
              └─ NO
                  │
                  Do you want zero config for a prototype?
                    ├─ YES → Parcel
                    └─ NO  → Vite ← recommended default for new apps
```

### Quick reference

| Scenario                               | Tool                             |
| -------------------------------------- | -------------------------------- |
| New React/Vue app                      | **Vite**                         |
| Existing large React app               | **Webpack** (or migrate to Vite) |
| React component library / npm package  | **Rollup** (or Vite lib mode)    |
| Next.js app                            | **Turbopack** (built-in)         |
| Quick prototype / hackathon            | **Parcel**                       |
| CI build speed critical, simple bundle | **esbuild** directly             |
| Replacing Babel in existing project    | **SWC**                          |

---

## 14. Configuration Deep-Dives

### Code splitting in Vite

```ts
// vite.config.ts
export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					// Vendor chunk for React
					if (id.includes('node_modules/react')) return 'react-vendor';
					// Vendor chunk for other libraries
					if (id.includes('node_modules')) return 'vendor';
				},
			},
		},
	},
});
```

### Module Federation with Vite (used in this project)

```ts
// vite.config.ts
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
	plugins: [
		federation({
			name: 'gold_invest', // remote app name
			filename: 'remoteEntry.js', // entry file consumed by host
			exposes: {
				'./Routes': './src/shared/routes.tsx',
				'./GoldPortfolio': './src/shared/gold-portfolio.tsx',
			},
			shared: ['react', 'react-dom', 'react-router', 'react-redux'],
		}),
	],
});
```

### Webpack Module Federation (equivalent)

```js
// webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
	plugins: [
		new ModuleFederationPlugin({
			name: 'gold_invest',
			filename: 'remoteEntry.js',
			exposes: {
				'./Routes': './src/shared/routes.tsx',
			},
			shared: {
				react: { singleton: true, requiredVersion: '^19.0.0' },
				'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
			},
		}),
	],
};
```

### Analyzing bundle size

```bash
# Webpack — webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
# Add to webpack plugins:
# new BundleAnalyzerPlugin()

# Vite — rollup-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer
```

```ts
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
	plugins: [visualizer({ open: true, filename: 'bundle-stats.html' })],
});
```

---

## 15. Concepts Every Developer Must Know

### Tree Shaking

Elimination of code that is imported but never used. Requires static ES module syntax:

```js
// ✅ Static — tree-shakeable
import { add } from './math';

// ❌ Dynamic — cannot tree-shake (the bundler can't know what you'll use at runtime)
const { add } = require('./math');
const fn = myObj['add'];
```

**Side effects** block tree shaking. Mark packages as side-effect-free in `package.json`:

```json
{ "sideEffects": false }
// or list files that have side effects:
{ "sideEffects": ["./src/styles/index.css", "./src/polyfills.js"] }
```

### Code Splitting

Splitting the bundle into multiple chunks loaded on demand:

```tsx
// Route-based splitting (most common)
const Buy = lazy(() => import('./screens/buy/buy'));
const Sell = lazy(() => import('./screens/sell/sell'));

// Used with Suspense
<Suspense fallback={<Spinner />}>
	<Route path="/buy" element={<Buy />} />
</Suspense>;
```

This creates separate chunk files per route. The initial JS payload is smaller — each route's code loads only when the user navigates to it.

### Content Hashing

```
dist/
  main.a1b2c3d4.js    ← hash changes only when content changes
  vendor.e5f6g7h8.js  ← hash stays the same if React version unchanged

Browser caches the file by URL.
Content hash means: if vendor.js hasn't changed, browser serves it from cache.
New deployment: only the changed chunks have new hashes — users re-download only those.
```

### Source Maps

```
dist/app.min.js (minified, unreadable)
dist/app.min.js.map (source map)

When a runtime error occurs in app.min.js line 1 col 53892:
  Source map translates → src/screens/buy/buy.tsx line 47 col 12
  DevTools shows the original source ✓
```

### Polyfills vs Transpiling

```
Transpiling: converting syntax (arrow functions → function declarations)
  → Babel/SWC handles this, output is equivalent code in older syntax

Polyfilling: adding missing APIs (Promise, fetch, Array.prototype.flat)
  → Syntax cannot be polyfilled (transpiling handles it)
  → APIs can be polyfilled by adding a runtime implementation
  → @babel/preset-env + useBuiltIns: 'usage' + core-js adds polyfills automatically
```

---

## 16. Q&A — Interview Prep

---

**Q: What is a bundler and why do we need one?**

A bundler resolves all the `import`/`require` statements in your codebase, starting from an entry point, follows every dependency recursively, transforms non-JavaScript files (TypeScript, JSX, CSS), and combines everything into one or a few output files that the browser can load. We need them because: browsers don't understand TypeScript or JSX; shipping hundreds of individual files would be slow (one HTTP request per file); and many modern syntax features need to be transpiled for cross-browser compatibility.

---

**Q: What is the difference between Webpack and Vite?**

Webpack bundles everything before serving — in dev mode it builds the entire dependency graph and outputs a bundle, which means startup is slow for large apps. Vite serves files as native ES modules directly to the browser in dev mode — no bundling happens at all. The browser requests files on demand and Vite transforms each file individually as it's requested. This makes Vite's dev server near-instant regardless of app size. For production, Vite uses Rollup to produce optimized bundles.

---

**Q: What is tree shaking and how does it work?**

Tree shaking is dead code elimination — removing exported code that is never imported anywhere. It relies on static analysis of `import`/`export` statements (ES modules). The bundler builds an "export usage" map: if a module exports `A` and `B` but only `A` is ever imported, `B` is not included in the output. It only works with static ES module syntax (`import`/`export`), not with dynamic `require()` because the bundler can't statically determine what's used at runtime.

---

**Q: What is code splitting and what problem does it solve?**

Code splitting divides the bundle into multiple chunks that are loaded on demand. Without it, all your code — including routes the user may never visit — is downloaded upfront. With code splitting, only the code for the initial route loads on page load. Other route chunks are fetched when the user navigates to them. This reduces the initial JavaScript payload, improving Time to Interactive (TTI) and First Contentful Paint (FCP).

---

**Q: What is HMR (Hot Module Replacement)?**

HMR is a dev server feature that replaces only the changed module in the running browser application — without a full page reload and without losing component state. When you edit a file, the dev server sends a WebSocket message to the browser with the updated module code. The browser replaces just that module and re-renders the affected components. Vite's HMR is particularly fast because it only needs to re-transform the changed file, not re-bundle the whole app.

---

**Q: What is the difference between Babel and SWC?**

Both are JavaScript/TypeScript transpilers — they transform source code (TS, JSX, modern JS) to plain JavaScript. Babel is written in JavaScript and is highly extensible with a rich plugin ecosystem. SWC is written in Rust and is 20–70× faster than Babel. SWC supports the most common Babel presets (env, react, typescript) natively. For new projects, SWC is the better choice unless you need a specific Babel plugin that SWC doesn't yet support. Next.js replaced Babel with SWC in v12.

---

**Q: What does esbuild do differently to be so fast?**

esbuild is written in Go (compiled to native machine code) rather than JavaScript. It parses and transforms all files in parallel using Go's goroutines. JavaScript-based tools like Webpack run on a single Node.js thread and serialize data between steps. esbuild also does everything in as few passes over the AST as possible, whereas Babel requires multiple passes. The result is 10–100× faster build times in benchmarks.

---

**Q: What is the difference between a loader and a plugin in Webpack?**

Loaders are **per-file transformers** — they take a file's content and return transformed content. They operate in the module resolution pipeline: `ts-loader` converts TypeScript to JS, `css-loader` resolves CSS imports, `sass-loader` compiles SCSS. Plugins hook into the **compilation lifecycle** — they can modify the output at the chunk or bundle level, inject HTML, extract CSS to separate files, etc. `HtmlWebpackPlugin` generates the HTML file; `MiniCssExtractPlugin` extracts all CSS into separate files.

---

**Q: What is Module Federation?**

Module Federation (Webpack 5 feature, also available in Vite via plugin) allows multiple separately-built apps to share code at runtime — without bundling everything together. One app (the "remote") exposes modules; another app (the "host") consumes them. The host downloads the remote's code at runtime. This is the architecture used in micro-frontends. In `gold-invest`, the app is a Module Federation **remote** that exposes routes and components consumed by the host app `TP_CLUB`.

---

**Q: What is the purpose of content hashing in build output filenames?**

Content hashing (e.g., `main.a1b2c3.js`) enables **long-term browser caching**. The browser caches the file by URL. If the file's content hasn't changed, its hash doesn't change, so the browser serves the cached version without re-downloading. When you deploy new code, only the files that actually changed have new hashes — the browser re-fetches only those, and all unchanged files are served from cache. Without content hashes, you'd have to invalidate all caches on every deployment.

---

**Q: What is a source map and why is it important?**

A source map is a file that maps the lines and columns of a minified/transpiled output file back to the original source. When a production error occurs in minified code like `a1b2c3.js:1:58291`, the source map lets the browser's DevTools (or Sentry) translate that position to the original `src/screens/buy/buy.tsx:47:12`. Without source maps, debugging production errors is nearly impossible. Source maps are typically not served to end users (excluded from the CDN or access-restricted) but uploaded to error monitoring tools like Sentry.

---

**Q: What is the difference between `devDependencies` and `dependencies` in the context of build tools?**

Build tools, transpilers (Babel, SWC), bundlers (Vite, Webpack), test runners (Vitest), and linters (ESLint) all go in `devDependencies` — they are only needed to build and develop the project, not at runtime in the browser/server. Runtime packages like React, Axios, Redux go in `dependencies`. For libraries published to npm, this distinction also affects bundle size for consumers: `devDependencies` are not installed when someone `npm install`s your library.
