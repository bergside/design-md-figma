# Project Structure and Build Configuration

Setting up a Figma plugin project with manifest, TypeScript, and build tools.

## Project Structure

### Minimal Structure

```
my-plugin/
├── manifest.json      # Plugin configuration
├── code.ts            # Main thread code
├── ui.html            # UI (optional)
└── package.json       # Dependencies
```

### Recommended Structure

```
my-plugin/
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.js   # or webpack/vite config
│
├── src/
│   ├── code.ts         # Main entry point
│   ├── ui.tsx          # UI entry point (React)
│   ├── types.ts        # Shared types
│   │
│   ├── features/       # Feature modules
│   │   ├── rename.ts
│   │   └── export.ts
│   │
│   └── utils/          # Utilities
│       ├── colors.ts
│       └── traversal.ts
│
├── ui/
│   ├── components/     # UI components
│   ├── hooks/          # React hooks
│   └── styles/         # CSS
│
└── dist/               # Build output
    ├── code.js
    └── ui.html
```

---

## manifest.json

### Minimal Manifest

```json
{
  "name": "My Plugin",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### Complete Manifest

```json
{
  "name": "My Plugin",
  "id": "1234567890123456789",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma", "figjam"],

  "capabilities": [],
  "enableProposedApi": false,
  "enablePrivatePluginApi": false,

  "menu": [
    {
      "name": "Run Plugin",
      "command": "run"
    },
    { "separator": true },
    {
      "name": "Settings",
      "command": "settings"
    },
    {
      "name": "Help",
      "command": "help"
    }
  ],

  "relaunchButtons": [
    {
      "command": "refresh",
      "name": "Refresh",
      "multipleSelection": true
    }
  ],

  "parameters": [
    {
      "name": "text",
      "key": "text",
      "description": "Text to insert",
      "allowFreeform": true
    }
  ],

  "parameterOnly": false,

  "documentAccess": "dynamic-page",

  "networkAccess": {
    "allowedDomains": ["api.example.com"],
    "reasoning": "Fetch data from our API"
  },

  "codegenLanguages": [
    {
      "label": "React",
      "value": "react"
    }
  ],

  "codegenPreferences": [
    {
      "itemType": "unit",
      "propertyName": "unitType",
      "label": "Unit Type",
      "options": [
        { "label": "Pixels", "value": "px", "isDefault": true },
        { "label": "REM", "value": "rem" }
      ]
    }
  ]
}
```

### Manifest Fields Reference

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Plugin name |
| `id` | Yes | Unique plugin ID (assigned by Figma) |
| `api` | Yes | API version |
| `main` | Yes | Path to main code file |
| `ui` | No | Path to UI HTML file |
| `editorType` | No | `["figma"]`, `["figjam"]`, or both |
| `menu` | No | Custom menu items |
| `relaunchButtons` | No | Buttons that persist on nodes |
| `parameters` | No | Quick action parameters |
| `documentAccess` | No | `"dynamic-page"` for large docs |
| `networkAccess` | No | Required for network requests |

### Menu Commands

```json
{
  "menu": [
    { "name": "Create Frame", "command": "create-frame" },
    { "name": "Create Text", "command": "create-text" },
    { "separator": true },
    {
      "name": "Utilities",
      "menu": [
        { "name": "Rename Layers", "command": "rename" },
        { "name": "Cleanup", "command": "cleanup" }
      ]
    }
  ]
}
```

```typescript
// code.ts
figma.on('run', ({ command }) => {
  switch (command) {
    case 'create-frame':
      createFrame();
      break;
    case 'create-text':
      createText();
      break;
    case 'rename':
      figma.showUI(__html__, { width: 300, height: 200 });
      break;
    default:
      figma.showUI(__html__);
  }
});
```

---

## TypeScript Setup

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["@figma/plugin-typings"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### tsconfig.ui.json (for UI with DOM)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2020", "DOM"],
    "types": ["@figma/plugin-typings"],
    "jsx": "react-jsx"
  },
  "include": ["src/ui.tsx", "ui/**/*"]
}
```

### Type Definitions

```bash
npm install --save-dev @figma/plugin-typings typescript
```

---

## Build Configuration

### esbuild (Recommended)

```javascript
// esbuild.config.js
const esbuild = require('esbuild');
const fs = require('fs');

// Build main thread code
esbuild.buildSync({
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2020',
  format: 'iife',
});

// Build UI
esbuild.buildSync({
  entryPoints: ['src/ui.tsx'],
  bundle: true,
  outfile: 'dist/ui.js',
  target: 'es2020',
  format: 'iife',
  loader: {
    '.tsx': 'tsx',
    '.css': 'css',
  },
});

// Inline JS into HTML
const uiJs = fs.readFileSync('dist/ui.js', 'utf8');
const uiCss = fs.readFileSync('ui/styles/main.css', 'utf8');
const uiHtml = `<!DOCTYPE html>
<html>
<head><style>${uiCss}</style></head>
<body>
  <div id="root"></div>
  <script>${uiJs}</script>
</body>
</html>`;
fs.writeFileSync('dist/ui.html', uiHtml);
```

### package.json Scripts

```json
{
  "scripts": {
    "build": "node esbuild.config.js",
    "watch": "node esbuild.config.js --watch",
    "dev": "npm run watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/**/*.ts"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.0.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        ui: resolve(__dirname, 'src/ui.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
```

### Webpack Configuration

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const path = require('path');

module.exports = [
  // Main thread
  {
    entry: './src/code.ts',
    output: {
      filename: 'code.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
  },
  // UI
  {
    entry: './src/ui.tsx',
    output: {
      filename: 'ui.js',
      path: path.resolve(__dirname, 'dist'),
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui.html',
        filename: 'ui.html',
        inject: 'body',
      }),
      new HtmlInlineScriptPlugin(),
    ],
  },
];
```
