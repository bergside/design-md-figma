# Selection, Traversal, and Batch Operations

Patterns for working with node selections, tree traversal, and batch processing.

## Selection Handling

### Get Typed Selection

```typescript
// Get all text nodes in selection
function getSelectedTextNodes(): TextNode[] {
  return figma.currentPage.selection.filter(
    (node): node is TextNode => node.type === 'TEXT'
  );
}

// Get all nodes with fills
function getSelectedNodesWithFills(): (SceneNode & GeometryMixin)[] {
  return figma.currentPage.selection.filter(
    (node): node is SceneNode & GeometryMixin => 'fills' in node
  );
}

// Get frames only
function getSelectedFrames(): FrameNode[] {
  return figma.currentPage.selection.filter(
    (node): node is FrameNode => node.type === 'FRAME'
  );
}
```

### Selection Guard

```typescript
function requireSelection(minCount: number = 1): SceneNode[] {
  const selection = figma.currentPage.selection;

  if (selection.length < minCount) {
    figma.notify(`Please select at least ${minCount} item(s)`);
    figma.closePlugin();
    return [];
  }

  return [...selection];
}

function requireSingleSelection(): SceneNode | null {
  const selection = figma.currentPage.selection;

  if (selection.length !== 1) {
    figma.notify('Please select exactly one item');
    return null;
  }

  return selection[0];
}

// Usage
const nodes = requireSelection(1);
if (nodes.length === 0) return;

// Process nodes...
```

### Selection Change Listener

```typescript
// Debounced selection handler
let selectionTimeout: number | null = null;

figma.on('selectionchange', () => {
  if (selectionTimeout) clearTimeout(selectionTimeout);

  selectionTimeout = setTimeout(() => {
    const selection = figma.currentPage.selection;

    figma.ui.postMessage({
      type: 'selection',
      nodes: selection.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
      })),
    });
  }, 100);
});
```

---

## Node Traversal

### Recursive Children

```typescript
// Get all descendants
function getAllChildren(node: SceneNode): SceneNode[] {
  const children: SceneNode[] = [];

  function traverse(n: SceneNode) {
    children.push(n);
    if ('children' in n) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return children;
}

// Get all descendants of a type
function findAllOfType<T extends SceneNode>(
  node: SceneNode,
  type: NodeType
): T[] {
  const results: T[] = [];

  function traverse(n: SceneNode) {
    if (n.type === type) {
      results.push(n as T);
    }
    if ('children' in n) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return results;
}

// Usage
const allText = findAllOfType<TextNode>(frame, 'TEXT');
```

### Walk Up (Find Parent)

```typescript
// Find parent of type
function findParentOfType<T extends BaseNode>(
  node: SceneNode,
  type: NodeType
): T | null {
  let current: BaseNode | null = node.parent;

  while (current) {
    if (current.type === type) {
      return current as T;
    }
    current = current.parent;
  }

  return null;
}

// Find parent frame
function findParentFrame(node: SceneNode): FrameNode | null {
  return findParentOfType<FrameNode>(node, 'FRAME');
}

// Find parent component
function findParentComponent(node: SceneNode): ComponentNode | null {
  return findParentOfType<ComponentNode>(node, 'COMPONENT');
}
```

### Sibling Navigation

```typescript
function getSiblings(node: SceneNode): SceneNode[] {
  const parent = node.parent;
  if (!parent || !('children' in parent)) return [];
  return [...parent.children];
}

function getNextSibling(node: SceneNode): SceneNode | null {
  const siblings = getSiblings(node);
  const index = siblings.indexOf(node);
  return siblings[index + 1] || null;
}

function getPreviousSibling(node: SceneNode): SceneNode | null {
  const siblings = getSiblings(node);
  const index = siblings.indexOf(node);
  return siblings[index - 1] || null;
}
```

---

## Batch Operations

### Process with Progress

```typescript
async function processWithProgress<T>(
  items: T[],
  processor: (item: T, index: number) => void | Promise<void>,
  options?: { batchSize?: number; label?: string }
): Promise<void> {
  const { batchSize = 50, label = 'Processing' } = options || {};
  const total = items.length;

  for (let i = 0; i < total; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    for (let j = 0; j < batch.length; j++) {
      await processor(batch[j], i + j);
    }

    // Update UI with progress
    figma.ui.postMessage({
      type: 'progress',
      current: Math.min(i + batchSize, total),
      total,
      label,
    });

    // Yield to Figma to prevent freezing
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

// Usage
await processWithProgress(
  figma.currentPage.selection,
  (node) => {
    if ('fills' in node) {
      node.fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
    }
  },
  { label: 'Updating colors' }
);
```

### Undo-Friendly Batching

```typescript
// Group changes for single undo
function batchChanges<T>(
  nodes: SceneNode[],
  transformer: (node: SceneNode) => void
): void {
  // Figma automatically groups rapid changes
  // Just process them quickly
  for (const node of nodes) {
    transformer(node);
  }
}

// For very large batches, use commitUndo
async function batchChangesLarge<T>(
  nodes: SceneNode[],
  transformer: (node: SceneNode) => Promise<void>
): Promise<void> {
  for (const node of nodes) {
    await transformer(node);
  }
  // Changes are automatically grouped
}
```
