# UI Architecture and Messaging

Building plugin user interfaces and inter-thread communication.

## UI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN THREAD (code.ts)                    │
│                                                             │
│   figma.showUI(__html__)                                    │
│         │                                                   │
│         ▼                                                   │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                 UI IFRAME (ui.html)                  │  │
│   │                                                      │  │
│   │   • Full browser environment                         │  │
│   │   • HTML, CSS, JavaScript                            │  │
│   │   • Can use React, Vue, Svelte, etc.                │  │
│   │   • NO access to Figma API                          │  │
│   │   • Communicates via postMessage                     │  │
│   │                                                      │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Showing UI

### Basic UI

```typescript
// code.ts
figma.showUI(__html__);  // __html__ is replaced with ui.html contents at build

// With options
figma.showUI(__html__, {
  width: 400,
  height: 300,
  title: 'My Plugin',
  visible: true,
  position: { x: 100, y: 100 },
  themeColors: true,  // Use Figma's theme colors
});
```

### UI Options

```typescript
interface ShowUIOptions {
  width?: number;           // Default: 300
  height?: number;          // Default: 200
  visible?: boolean;        // Default: true
  position?: { x: number; y: number };
  title?: string;
  themeColors?: boolean;    // Inject Figma CSS variables
}
```

### Resize UI

```typescript
// From main thread
figma.ui.resize(500, 400);

// From UI (request main thread to resize)
parent.postMessage({
  pluginMessage: { type: 'resize', width: 500, height: 400 }
}, '*');

// code.ts
figma.ui.onmessage = (msg) => {
  if (msg.type === 'resize') {
    figma.ui.resize(msg.width, msg.height);
  }
};
```

---

## Message Communication

### UI → Main Thread

```html
<!-- ui.html -->
<script>
// Send message to main thread
function sendMessage(type, data) {
  parent.postMessage({ pluginMessage: { type, ...data } }, '*');
}

// Examples
sendMessage('create-shape', { shape: 'rectangle', width: 100, height: 50 });
sendMessage('update-color', { color: '#FF5733' });
sendMessage('close');
</script>
```

### Main Thread → UI

```typescript
// code.ts
// Send data to UI
figma.ui.postMessage({
  type: 'selection-data',
  nodes: figma.currentPage.selection.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
  })),
});

// Send on selection change
figma.on('selectionchange', () => {
  figma.ui.postMessage({
    type: 'selection-changed',
    count: figma.currentPage.selection.length,
  });
});
```

### Receiving in UI

```html
<script>
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'selection-data':
      renderNodes(msg.nodes);
      break;
    case 'selection-changed':
      updateCount(msg.count);
      break;
    case 'error':
      showError(msg.message);
      break;
  }
};
</script>
```

### Typed Messages

```typescript
// shared/types.ts
export type MainToUI =
  | { type: 'selection-changed'; count: number }
  | { type: 'node-data'; node: SerializedNode }
  | { type: 'error'; message: string }
  | { type: 'styles-loaded'; styles: StyleData[] };

export type UIToMain =
  | { type: 'create-shape'; shape: 'rectangle' | 'ellipse'; size: number }
  | { type: 'apply-style'; styleId: string }
  | { type: 'close' };

// code.ts
figma.ui.onmessage = (msg: UIToMain) => {
  switch (msg.type) {
    case 'create-shape':
      // TypeScript knows shape and size exist
      break;
  }
};

// ui.ts
declare function postMessage(msg: UIToMain): void;
```

---

## Plain HTML/CSS/JS

### Basic Structure

```html
<!-- ui.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: Inter, system-ui, sans-serif;
      font-size: 11px;
      color: var(--figma-color-text);
      background: var(--figma-color-bg);
      padding: 12px;
    }

    .input-group {
      margin-bottom: 12px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }

    input, select {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--figma-color-border);
      border-radius: 4px;
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--figma-color-border-brand);
    }

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-primary {
      background: var(--figma-color-bg-brand);
      color: white;
    }

    .btn-secondary {
      background: var(--figma-color-bg-secondary);
      color: var(--figma-color-text);
    }

    .btn-row {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="input-group">
    <label for="name">Name</label>
    <input type="text" id="name" placeholder="Enter name">
  </div>

  <div class="input-group">
    <label for="size">Size</label>
    <input type="number" id="size" value="100" min="1">
  </div>

  <div class="btn-row">
    <button class="btn-secondary" id="cancel">Cancel</button>
    <button class="btn-primary" id="create">Create</button>
  </div>

  <script>
    const nameInput = document.getElementById('name');
    const sizeInput = document.getElementById('size');

    document.getElementById('create').onclick = () => {
      parent.postMessage({
        pluginMessage: {
          type: 'create',
          name: nameInput.value,
          size: parseInt(sizeInput.value, 10),
        }
      }, '*');
    };

    document.getElementById('cancel').onclick = () => {
      parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
    };

    // Receive messages
    window.onmessage = (event) => {
      const msg = event.data.pluginMessage;
      if (msg?.type === 'update') {
        nameInput.value = msg.name || '';
      }
    };
  </script>
</body>
</html>
```
