# UI Patterns and Resources

Common UI patterns for Figma plugins and working with external resources.

## Common UI Patterns

### Loading State

```html
<div id="loading" class="loading">
  <div class="spinner"></div>
  <p>Loading...</p>
</div>

<div id="content" class="hidden">
  <!-- Main content -->
</div>

<style>
.hidden { display: none; }

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--figma-color-border);
  border-top-color: var(--figma-color-bg-brand);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<script>
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg?.type === 'ready') {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
  }
};
</script>
```

### Tabs

```html
<div class="tabs">
  <button class="tab active" data-tab="settings">Settings</button>
  <button class="tab" data-tab="export">Export</button>
  <button class="tab" data-tab="about">About</button>
</div>

<div class="tab-content active" id="settings">
  <!-- Settings content -->
</div>
<div class="tab-content" id="export">
  <!-- Export content -->
</div>
<div class="tab-content" id="about">
  <!-- About content -->
</div>

<style>
.tabs {
  display: flex;
  border-bottom: 1px solid var(--figma-color-border);
  margin-bottom: 12px;
}

.tab {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--figma-color-text-secondary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.tab.active {
  color: var(--figma-color-text);
  border-bottom-color: var(--figma-color-bg-brand);
}

.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}
</style>

<script>
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(tab.dataset.tab).classList.add('active');
  };
});
</script>
```

### Color Picker

```html
<div class="color-picker">
  <input type="color" id="color" value="#0066FF">
  <input type="text" id="color-hex" value="#0066FF" maxlength="7">
</div>

<style>
.color-picker {
  display: flex;
  gap: 8px;
}

input[type="color"] {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--figma-color-border);
  border-radius: 4px;
  cursor: pointer;
}

input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 2px;
}

input[type="color"]::-webkit-color-swatch {
  border-radius: 2px;
  border: none;
}
</style>

<script>
const colorInput = document.getElementById('color');
const hexInput = document.getElementById('color-hex');

colorInput.oninput = () => {
  hexInput.value = colorInput.value.toUpperCase();
};

hexInput.oninput = () => {
  if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
    colorInput.value = hexInput.value;
  }
};
</script>
```

### Node List

```html
<ul id="node-list" class="node-list"></ul>

<style>
.node-list {
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--figma-color-border);
  border-radius: 4px;
}

.node-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid var(--figma-color-border);
}

.node-item:last-child {
  border-bottom: none;
}

.node-item:hover {
  background: var(--figma-color-bg-hover);
}

.node-item.selected {
  background: var(--figma-color-bg-selected);
}

.node-icon {
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

<script>
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg?.type === 'nodes') {
    renderNodes(msg.nodes);
  }
};

function renderNodes(nodes) {
  const list = document.getElementById('node-list');
  // Note: In production, use DOM methods instead of innerHTML for security
  list.textContent = '';
  nodes.forEach(node => {
    const li = document.createElement('li');
    li.className = 'node-item';
    li.dataset.id = node.id;

    const icon = document.createElement('span');
    icon.className = 'node-icon';
    icon.textContent = getIcon(node.type);

    const name = document.createElement('span');
    name.className = 'node-name';
    name.textContent = node.name;

    li.appendChild(icon);
    li.appendChild(name);

    li.onclick = () => {
      parent.postMessage({
        pluginMessage: { type: 'select-node', id: li.dataset.id }
      }, '*');
    };

    list.appendChild(li);
  });
}

function getIcon(type) {
  const icons = {
    FRAME: '⬜',
    TEXT: 'T',
    RECTANGLE: '▢',
    ELLIPSE: '○',
    COMPONENT: '◇',
    INSTANCE: '◆',
  };
  return icons[type] || '•';
}
</script>
```

---

## File Downloads

```typescript
// code.ts - Export and send to UI
const bytes = await node.exportAsync({ format: 'PNG' });
figma.ui.postMessage({
  type: 'download',
  bytes: Array.from(bytes),
  filename: `${node.name}.png`,
  mimeType: 'image/png',
});
```

```html
<!-- ui.html -->
<script>
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (msg?.type === 'download') {
    downloadFile(msg.bytes, msg.filename, msg.mimeType);
  }
};

function downloadFile(bytes, filename, mimeType) {
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
</script>
```

---

## External Resources

```html
<!-- Load external fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<!-- Load external scripts (bundled is preferred) -->
<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>

<!-- Note: Be careful with external resources -->
<!-- - They require internet connection -->
<!-- - May slow down plugin load -->
<!-- - Bundle when possible for better UX -->
```
