# Layout, Storage, and Utilities

Positioning, alignment, persistent storage, error handling, and utility patterns.

## Positioning & Layout

### Center in Viewport

```typescript
function centerInViewport(node: SceneNode): void {
  const center = figma.viewport.center;
  node.x = center.x - node.width / 2;
  node.y = center.y - node.height / 2;
}

// Scroll to node
function scrollToNode(node: SceneNode): void {
  figma.viewport.scrollAndZoomIntoView([node]);
}
```

### Align Nodes

```typescript
type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function alignNodes(nodes: SceneNode[], alignment: Alignment): void {
  if (nodes.length < 2) return;

  const bounds = nodes.map(n => ({
    left: n.x,
    right: n.x + n.width,
    top: n.y,
    bottom: n.y + n.height,
    centerX: n.x + n.width / 2,
    centerY: n.y + n.height / 2,
  }));

  switch (alignment) {
    case 'left': {
      const minX = Math.min(...bounds.map(b => b.left));
      nodes.forEach(n => { n.x = minX; });
      break;
    }
    case 'center': {
      const avgX = bounds.reduce((sum, b) => sum + b.centerX, 0) / bounds.length;
      nodes.forEach(n => { n.x = avgX - n.width / 2; });
      break;
    }
    case 'right': {
      const maxX = Math.max(...bounds.map(b => b.right));
      nodes.forEach(n => { n.x = maxX - n.width; });
      break;
    }
    case 'top': {
      const minY = Math.min(...bounds.map(b => b.top));
      nodes.forEach(n => { n.y = minY; });
      break;
    }
    case 'middle': {
      const avgY = bounds.reduce((sum, b) => sum + b.centerY, 0) / bounds.length;
      nodes.forEach(n => { n.y = avgY - n.height / 2; });
      break;
    }
    case 'bottom': {
      const maxY = Math.max(...bounds.map(b => b.bottom));
      nodes.forEach(n => { n.y = maxY - n.height; });
      break;
    }
  }
}
```

### Distribute Evenly

```typescript
function distributeHorizontally(nodes: SceneNode[]): void {
  if (nodes.length < 3) return;

  // Sort by x position
  const sorted = [...nodes].sort((a, b) => a.x - b.x);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalWidth = sorted.reduce((sum, n) => sum + n.width, 0);
  const totalSpace = (last.x + last.width) - first.x - totalWidth;
  const gap = totalSpace / (sorted.length - 1);

  let currentX = first.x + first.width + gap;

  for (let i = 1; i < sorted.length - 1; i++) {
    sorted[i].x = currentX;
    currentX += sorted[i].width + gap;
  }
}

function distributeVertically(nodes: SceneNode[]): void {
  if (nodes.length < 3) return;

  const sorted = [...nodes].sort((a, b) => a.y - b.y);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalHeight = sorted.reduce((sum, n) => sum + n.height, 0);
  const totalSpace = (last.y + last.height) - first.y - totalHeight;
  const gap = totalSpace / (sorted.length - 1);

  let currentY = first.y + first.height + gap;

  for (let i = 1; i < sorted.length - 1; i++) {
    sorted[i].y = currentY;
    currentY += sorted[i].height + gap;
  }
}
```

---

## Storage Patterns

### Persistent Settings

```typescript
interface PluginSettings {
  lastColor: string;
  gridSize: number;
  showGuides: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  lastColor: '#000000',
  gridSize: 8,
  showGuides: true,
};

async function loadSettings(): Promise<PluginSettings> {
  const stored = await figma.clientStorage.getAsync('settings');
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function saveSettings(settings: Partial<PluginSettings>): Promise<void> {
  const current = await loadSettings();
  await figma.clientStorage.setAsync('settings', { ...current, ...settings });
}

// Usage
const settings = await loadSettings();
settings.lastColor = '#FF0000';
await saveSettings(settings);
```

### Node Data

```typescript
// Store data on a node (survives copy/paste)
function setNodeData<T>(node: SceneNode, key: string, data: T): void {
  node.setPluginData(key, JSON.stringify(data));
}

function getNodeData<T>(node: SceneNode, key: string): T | null {
  const data = node.getPluginData(key);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Example: Track which nodes were processed
interface ProcessedMeta {
  processedAt: string;
  version: string;
}

function markAsProcessed(node: SceneNode): void {
  setNodeData<ProcessedMeta>(node, 'processed', {
    processedAt: new Date().toISOString(),
    version: '1.0.0',
  });
}

function isProcessed(node: SceneNode): boolean {
  return getNodeData<ProcessedMeta>(node, 'processed') !== null;
}
```

---

## Error Handling

### Safe Execution

```typescript
async function safeExecute<T>(
  fn: () => T | Promise<T>,
  errorMessage: string = 'An error occurred'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    figma.notify(errorMessage, { error: true });
    return null;
  }
}

// Usage
const result = await safeExecute(
  () => processNodes(selection),
  'Failed to process nodes'
);

if (result === null) {
  figma.closePlugin();
  return;
}
```

### Validation

```typescript
function validateInput(input: unknown): input is ValidInput {
  if (!input || typeof input !== 'object') return false;
  // Add validation logic
  return true;
}

// With error messages
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateCreateInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input.name || typeof input.name !== 'string') {
    errors.push('Name is required');
  }

  if (typeof input.size !== 'number' || input.size <= 0) {
    errors.push('Size must be a positive number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Usage
figma.ui.onmessage = (msg) => {
  const validation = validateCreateInput(msg);

  if (!validation.valid) {
    figma.ui.postMessage({
      type: 'validation-error',
      errors: validation.errors,
    });
    return;
  }

  // Proceed with valid input
};
```

---

## Utilities

### Generate Unique Names

```typescript
function generateUniqueName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let counter = 1;
  let newName = `${baseName} ${counter}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName} ${counter}`;
  }

  return newName;
}

// Usage
const existingNames = figma.currentPage.children.map(n => n.name);
const newName = generateUniqueName('Frame', existingNames);
```

### Debounce

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Usage
const debouncedUpdate = debounce((selection: SceneNode[]) => {
  figma.ui.postMessage({ type: 'selection', nodes: selection.map(n => n.name) });
}, 200);

figma.on('selectionchange', () => {
  debouncedUpdate(figma.currentPage.selection);
});
```

### Clone Properties

```typescript
// Copy visual properties from one node to another
function copyAppearance(
  source: SceneNode & GeometryMixin,
  target: SceneNode & GeometryMixin
): void {
  if ('fills' in source && 'fills' in target) {
    target.fills = [...source.fills];
  }

  if ('strokes' in source && 'strokes' in target) {
    target.strokes = [...source.strokes];
    target.strokeWeight = source.strokeWeight;
  }

  if ('effects' in source && 'effects' in target) {
    target.effects = [...source.effects];
  }

  if ('opacity' in source && 'opacity' in target) {
    target.opacity = source.opacity;
  }

  if ('cornerRadius' in source && 'cornerRadius' in target) {
    (target as RectangleNode).cornerRadius = (source as RectangleNode).cornerRadius;
  }
}
```
