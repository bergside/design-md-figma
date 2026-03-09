# React UI and Figma Theming

Using React for plugin UI and Figma's theme color system.

## Using React

### Setup with Create React App

```bash
# Using Figma plugin template
npx degit nicebook/figma-plugin-react-template my-plugin
cd my-plugin
npm install
```

### Manual React Setup

```typescript
// ui.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './ui.css';

// Types
type Message =
  | { type: 'selection-changed'; count: number }
  | { type: 'node-data'; node: { name: string; type: string } };

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [size, setSize] = useState(100);

  // Listen for messages from main thread
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as Message;
      if (!msg) return;

      if (msg.type === 'selection-changed') {
        setCount(msg.count);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Send message to main thread
  const postMessage = useCallback((message: any) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);

  const handleCreate = () => {
    postMessage({ type: 'create', name, size });
  };

  const handleClose = () => {
    postMessage({ type: 'close' });
  };

  return (
    <div className="container">
      <p className="selection-info">
        {count} items selected
      </p>

      <div className="input-group">
        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>Size</label>
        <input
          type="number"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value, 10))}
        />
      </div>

      <div className="btn-row">
        <button className="btn-secondary" onClick={handleClose}>
          Cancel
        </button>
        <button className="btn-primary" onClick={handleCreate}>
          Create
        </button>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

### Custom Hook for Figma Messages

```typescript
// hooks/useFigmaMessage.ts
import { useEffect, useCallback } from 'react';

type MessageHandler<T> = (message: T) => void;

export function useFigmaMessage<T>(handler: MessageHandler<T>) {
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const msg = event.data.pluginMessage;
      if (msg) {
        handler(msg as T);
      }
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}

export function usePostMessage() {
  return useCallback((message: any) => {
    parent.postMessage({ pluginMessage: message }, '*');
  }, []);
}

// Usage
function App() {
  const [data, setData] = useState(null);
  const postMessage = usePostMessage();

  useFigmaMessage((msg) => {
    if (msg.type === 'data') {
      setData(msg.data);
    }
  });

  return (
    <button onClick={() => postMessage({ type: 'fetch-data' })}>
      Fetch Data
    </button>
  );
}
```

---

## Figma Theme Colors

When `themeColors: true`, Figma injects CSS variables:

```css
/* Available CSS variables */
:root {
  /* Text */
  --figma-color-text: /* primary text */;
  --figma-color-text-secondary: /* secondary text */;
  --figma-color-text-tertiary: /* tertiary text */;
  --figma-color-text-disabled: /* disabled text */;
  --figma-color-text-onbrand: /* text on brand color */;
  --figma-color-text-onbrand-secondary: /* secondary text on brand */;
  --figma-color-text-danger: /* error text */;
  --figma-color-text-warning: /* warning text */;
  --figma-color-text-success: /* success text */;

  /* Backgrounds */
  --figma-color-bg: /* primary background */;
  --figma-color-bg-secondary: /* secondary background */;
  --figma-color-bg-tertiary: /* tertiary background */;
  --figma-color-bg-brand: /* brand background */;
  --figma-color-bg-brand-hover: /* brand hover */;
  --figma-color-bg-brand-pressed: /* brand pressed */;
  --figma-color-bg-danger: /* danger background */;
  --figma-color-bg-warning: /* warning background */;
  --figma-color-bg-success: /* success background */;
  --figma-color-bg-hover: /* hover state */;
  --figma-color-bg-pressed: /* pressed state */;
  --figma-color-bg-selected: /* selected state */;

  /* Borders */
  --figma-color-border: /* primary border */;
  --figma-color-border-strong: /* strong border */;
  --figma-color-border-brand: /* brand border */;
  --figma-color-border-danger: /* danger border */;

  /* Icons */
  --figma-color-icon: /* primary icon */;
  --figma-color-icon-secondary: /* secondary icon */;
  --figma-color-icon-tertiary: /* tertiary icon */;
  --figma-color-icon-brand: /* brand icon */;
  --figma-color-icon-danger: /* danger icon */;
}
```

### Using Theme Colors

```css
/* Automatically adapts to light/dark mode */
body {
  background: var(--figma-color-bg);
  color: var(--figma-color-text);
}

.card {
  background: var(--figma-color-bg-secondary);
  border: 1px solid var(--figma-color-border);
}

.btn-primary {
  background: var(--figma-color-bg-brand);
  color: var(--figma-color-text-onbrand);
}

.btn-primary:hover {
  background: var(--figma-color-bg-brand-hover);
}

.error {
  color: var(--figma-color-text-danger);
  background: var(--figma-color-bg-danger);
}
```
