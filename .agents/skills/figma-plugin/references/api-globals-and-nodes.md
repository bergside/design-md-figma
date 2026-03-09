# Plugin API: Globals and Node Types

Core Figma Plugin API reference for global objects and node types.

## Global Objects

### figma

The main API entry point, available in the main thread.

```typescript
// Document
figma.root                    // DocumentNode
figma.currentPage             // PageNode
figma.currentPage.selection   // readonly SceneNode[]

// Create nodes
figma.createRectangle()
figma.createEllipse()
figma.createPolygon()
figma.createStar()
figma.createLine()
figma.createFrame()
figma.createComponent()
figma.createComponentSet()
figma.createText()
figma.createBooleanOperation()
figma.createVector()
figma.createSlice()
figma.createConnector()        // FigJam
figma.createSticky()           // FigJam
figma.createShapeWithText()    // FigJam

// UI
figma.showUI(__html__, options?)
figma.ui.postMessage(message)
figma.ui.onmessage = (msg) => {}
figma.ui.resize(width, height)
figma.ui.close()
figma.closePlugin(message?)

// Viewport
figma.viewport.center          // Vector
figma.viewport.zoom            // number
figma.viewport.scrollAndZoomIntoView(nodes)

// Styles
figma.getLocalPaintStyles()
figma.getLocalTextStyles()
figma.getLocalEffectStyles()
figma.getLocalGridStyles()
figma.createPaintStyle()
figma.createTextStyle()
figma.createEffectStyle()
figma.createGridStyle()

// Search
figma.getNodeById(id)
figma.getStyleById(id)
figma.currentPage.findAll(callback?)
figma.currentPage.findOne(callback)
figma.currentPage.findChildren(callback?)
figma.currentPage.findAllWithCriteria({ types: [...] })

// Events
figma.on('selectionchange', callback)
figma.on('currentpagechange', callback)
figma.on('close', callback)
figma.on('run', callback)
figma.on('drop', callback)
figma.once(event, callback)
figma.off(event, callback)

// Notifications
figma.notify(message, options?)

// Storage
figma.clientStorage.getAsync(key)
figma.clientStorage.setAsync(key, value)
figma.clientStorage.deleteAsync(key)
figma.clientStorage.keysAsync()

// Fonts
figma.loadFontAsync(fontName)
figma.listAvailableFontsAsync()

// Images
figma.createImage(data)        // Uint8Array
figma.getImageByHash(hash)

// Variables (Design Tokens)
figma.variables.getLocalVariables()
figma.variables.getLocalVariableCollections()
figma.variables.createVariable(name, collectionId, type)
figma.variables.createVariableCollection(name)

// Parameters (for parameterized plugins)
figma.parameters.on('input', callback)

// Payments
figma.payments.getPluginPaymentTokenAsync()
figma.payments.initiateCheckoutAsync(options)
```

---

## Node Types

### Document Structure

```typescript
// DocumentNode (figma.root)
interface DocumentNode {
  readonly type: 'DOCUMENT';
  readonly children: readonly PageNode[];
  name: string;
}

// PageNode
interface PageNode {
  readonly type: 'PAGE';
  readonly children: readonly SceneNode[];
  name: string;
  selection: readonly SceneNode[];
  selectedTextRange: { node: TextNode; start: number; end: number } | null;
  backgrounds: readonly Paint[];
  guides: readonly Guide[];

  // Methods
  findAll(callback?: (node: SceneNode) => boolean): SceneNode[];
  findOne(callback: (node: SceneNode) => boolean): SceneNode | null;
  findChildren(callback?: (node: SceneNode) => boolean): SceneNode[];
  findAllWithCriteria(criteria: { types: NodeType[] }): SceneNode[];
}
```

### Frame & Group

```typescript
interface FrameNode {
  readonly type: 'FRAME';

  // Children
  readonly children: readonly SceneNode[];
  appendChild(child: SceneNode): void;
  insertChild(index: number, child: SceneNode): void;

  // Layout
  x: number;
  y: number;
  width: number;
  height: number;
  resize(width: number, height: number): void;
  resizeWithoutConstraints(width: number, height: number): void;

  // Auto Layout
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode: 'FIXED' | 'AUTO';
  counterAxisSizingMode: 'FIXED' | 'AUTO';
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;

  // Appearance
  fills: readonly Paint[];
  strokes: readonly Paint[];
  strokeWeight: number;
  cornerRadius: number;
  opacity: number;
  effects: readonly Effect[];

  // Constraints
  constraints: Constraints;

  // Clipping
  clipsContent: boolean;
}

interface GroupNode {
  readonly type: 'GROUP';
  readonly children: readonly SceneNode[];
  // Groups cannot have fills/strokes directly
  // Transform only
}
```

### Shapes

```typescript
interface RectangleNode {
  readonly type: 'RECTANGLE';
  x: number;
  y: number;
  width: number;
  height: number;

  // Corner radius
  cornerRadius: number;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;

  // Appearance
  fills: readonly Paint[];
  strokes: readonly Paint[];
  strokeWeight: number;
  strokeAlign: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  opacity: number;
  effects: readonly Effect[];
}

interface EllipseNode {
  readonly type: 'ELLIPSE';
  x: number;
  y: number;
  width: number;
  height: number;

  // Arc
  arcData: ArcData;

  // Appearance
  fills: readonly Paint[];
  strokes: readonly Paint[];
}

interface PolygonNode {
  readonly type: 'POLYGON';
  pointCount: number;  // Number of sides
  // ... same appearance properties
}

interface StarNode {
  readonly type: 'STAR';
  pointCount: number;
  innerRadius: number;  // 0-1, ratio of inner to outer radius
  // ... same appearance properties
}

interface LineNode {
  readonly type: 'LINE';
  x: number;
  y: number;
  width: number;  // Length of line
  rotation: number;
  strokes: readonly Paint[];
  strokeWeight: number;
  strokeCap: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
}

interface VectorNode {
  readonly type: 'VECTOR';
  vectorNetwork: VectorNetwork;
  vectorPaths: VectorPaths;
  // For complex paths
}
```

### Text

```typescript
interface TextNode {
  readonly type: 'TEXT';

  // Content
  characters: string;

  // Must load font before setting characters
  fontName: FontName | typeof figma.mixed;
  fontSize: number | typeof figma.mixed;
  fontWeight: number | typeof figma.mixed;

  // Styling
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
  textCase: TextCase | typeof figma.mixed;
  textDecoration: TextDecoration | typeof figma.mixed;
  letterSpacing: LetterSpacing | typeof figma.mixed;
  lineHeight: LineHeight | typeof figma.mixed;
  paragraphIndent: number;
  paragraphSpacing: number;

  // Range methods (for mixed styles)
  getRangeFontName(start: number, end: number): FontName | typeof figma.mixed;
  setRangeFontName(start: number, end: number, value: FontName): void;
  getRangeFontSize(start: number, end: number): number | typeof figma.mixed;
  setRangeFontSize(start: number, end: number, value: number): void;
  getRangeFills(start: number, end: number): Paint[] | typeof figma.mixed;
  setRangeFills(start: number, end: number, value: Paint[]): void;
  // ... more range methods for other properties

  // Hyperlinks
  getRangeHyperlink(start: number, end: number): HyperlinkTarget | null;
  setRangeHyperlink(start: number, end: number, value: HyperlinkTarget | null): void;
}

interface FontName {
  family: string;
  style: string;  // 'Regular', 'Bold', 'Italic', etc.
}

// Load font before use
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
```

### Components

```typescript
interface ComponentNode {
  readonly type: 'COMPONENT';

  // Same as FrameNode, plus:
  readonly key: string;  // Unique identifier
  description: string;
  documentationLinks: readonly DocumentationLink[];

  // Create instance
  createInstance(): InstanceNode;
}

interface ComponentSetNode {
  readonly type: 'COMPONENT_SET';
  readonly children: readonly ComponentNode[];  // Variants
  // Component set for variants
}

interface InstanceNode {
  readonly type: 'INSTANCE';

  // Reference to main component
  readonly mainComponent: ComponentNode | null;

  // Override properties
  overrides: readonly Override[];

  // Swap instance
  swapComponent(newComponent: ComponentNode): void;

  // Detach from component
  detachInstance(): FrameNode;

  // Reset overrides
  resetOverrides(): void;
}
```
