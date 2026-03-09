# Development, Testing, and Publishing

Development workflow, testing strategies, publishing, and troubleshooting.

## Development Workflow

### Local Development

1. **Open Figma Desktop**
2. **Plugins -> Development -> Import plugin from manifest**
3. **Select your `manifest.json`**
4. **Run `npm run watch`** in terminal
5. **Make changes** -> Save -> **Plugins -> Development -> Your Plugin**
6. **Use Console** (Plugins -> Development -> Show/Hide Console)

### Hot Reload (Sort of)

Figma doesn't support true hot reload. Workaround:

```typescript
// code.ts - During development
figma.showUI(__html__, { width: 400, height: 300 });

// Close and reopen to see changes
// Keyboard shortcut: Cmd/Ctrl + Alt + P (run last plugin)
```

### Console Logging

```typescript
// Main thread - appears in Figma console
console.log('Main thread log');

// UI thread - appears in browser console
// View with: Plugins -> Development -> Show/Hide Console
console.log('UI log');
```

---

## Testing

### Manual Testing Checklist

- [ ] Plugin loads without errors
- [ ] UI displays correctly
- [ ] Selection handling works
- [ ] Empty selection handled
- [ ] Large selection handled
- [ ] Error states handled
- [ ] Cancel/close works
- [ ] Undo works after plugin actions
- [ ] Works in both light and dark themes

### Automated Testing

```typescript
// __tests__/utils.test.ts
import { hexToRgb, rgbToHex } from '../src/utils/colors';

describe('hexToRgb', () => {
  test('converts hex to RGB', () => {
    expect(hexToRgb('#FF0000')).toEqual({ r: 1, g: 0, b: 0 });
    expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 1, b: 0 });
    expect(hexToRgb('#0000FF')).toEqual({ r: 0, g: 0, b: 1 });
  });
});
```

```json
// package.json
{
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

### Mock Figma API

```typescript
// __mocks__/figma.ts
export const figma = {
  currentPage: {
    selection: [],
    findAll: jest.fn(() => []),
    findOne: jest.fn(() => null),
  },
  createRectangle: jest.fn(() => ({
    type: 'RECTANGLE',
    x: 0,
    y: 0,
    resize: jest.fn(),
  })),
  notify: jest.fn(),
  closePlugin: jest.fn(),
  ui: {
    postMessage: jest.fn(),
    onmessage: null,
  },
};

// jest.setup.ts
(global as any).figma = figma;
```

---

## Publishing

### Prepare for Publishing

1. **Create cover image** (1920x960)
2. **Create icon** (128x128)
3. **Write description**
4. **Test thoroughly**
5. **Build production bundle**

### manifest.json for Publishing

```json
{
  "name": "My Awesome Plugin",
  "id": "1234567890123456789",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "editorType": ["figma"]
}
```

### Publishing Steps

1. **Go to Figma** -> Plugins -> Manage plugins
2. **Find your development plugin**
3. **Click "Publish"**
4. **Fill in details:**
   - Name (up to 50 characters)
   - Tagline (up to 100 characters)
   - Description (markdown supported)
   - Cover image
   - Categories
   - Tags
5. **Submit for review**

### Review Guidelines

Figma reviews plugins for:
- **Security**: No malicious code
- **Privacy**: Clear data handling
- **Quality**: Works as described
- **Guidelines**: Follows community guidelines

Common rejection reasons:
- Plugin crashes or has major bugs
- Missing or misleading description
- Inappropriate content
- Privacy policy issues (if collecting data)

### Updating Published Plugin

1. **Update version** in code if tracking
2. **Build production bundle**
3. **Go to Figma** -> Plugins -> Manage plugins
4. **Click "Edit"** on your plugin
5. **Upload new files**
6. **Update description if needed**
7. **Submit update**

---

## Common Issues

### "Plugin timed out"

```typescript
// PROBLEM: Long-running operation
for (let i = 0; i < 10000; i++) {
  figma.createRectangle();
}

// SOLUTION: Batch with yields
async function createMany(count: number) {
  for (let i = 0; i < count; i += 100) {
    for (let j = 0; j < Math.min(100, count - i); j++) {
      figma.createRectangle();
    }
    await new Promise(r => setTimeout(r, 0));
  }
}
```

### "Cannot read properties of null"

```typescript
// PROBLEM: Not checking for null
const node = figma.currentPage.selection[0];
node.name = 'New name'; // Crashes if nothing selected

// SOLUTION: Check first
const selection = figma.currentPage.selection;
if (selection.length === 0) {
  figma.notify('Select something first');
  return;
}
const node = selection[0];
```

### "Font not loaded"

```typescript
// PROBLEM: Modifying text without loading font
const text = figma.createText();
text.characters = 'Hello'; // Error!

// SOLUTION: Load font first
const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = 'Hello';
```

### UI Not Showing

```typescript
// PROBLEM: Missing __html__
figma.showUI('<html>...</html>'); // Won't work

// SOLUTION: Use __html__ (replaced at build time)
figma.showUI(__html__);

// Or for inline HTML (development only)
figma.showUI(`<html><body>Hello</body></html>`, { width: 200, height: 100 });
```

### Network Requests Blocked

```json
// manifest.json - Add network access
{
  "networkAccess": {
    "allowedDomains": ["api.example.com"],
    "reasoning": "Fetch data from our API"
  }
}
```

---

## Templates & Starters

### Official Templates

```bash
# Create React App template
npx create-react-app my-plugin --template figma-plugin

# Figma's official starter
# Download from: https://www.figma.com/plugin-docs/setup/
```

### Community Templates

```bash
# TypeScript + esbuild
npx degit nicebook/figma-plugin-typescript-template my-plugin

# React + TypeScript
npx degit nicebook/figma-plugin-react-template my-plugin

# Svelte
npx degit nicebook/figma-plugin-svelte-template my-plugin
```

### Minimal Starter

```bash
mkdir my-plugin && cd my-plugin
npm init -y
npm install --save-dev @figma/plugin-typings typescript esbuild
```

Create files:
- `manifest.json` (copy from above)
- `src/code.ts`
- `tsconfig.json` (copy from above)
- `esbuild.config.js` (copy from above)
