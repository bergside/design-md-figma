# Plugin API: Rendering and Advanced Features

Paint types, effects, auto layout, styles, variables, events, export, and helpers.

## Paint Types

```typescript
type Paint = SolidPaint | GradientPaint | ImagePaint | VideoPaint;

interface SolidPaint {
  type: 'SOLID';
  color: RGB;
  opacity?: number;  // 0-1
  visible?: boolean;
  blendMode?: BlendMode;
}

interface GradientPaint {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  gradientStops: readonly ColorStop[];
  gradientTransform: Transform;
  opacity?: number;
  visible?: boolean;
}

interface ColorStop {
  position: number;  // 0-1
  color: RGBA;
}

interface ImagePaint {
  type: 'IMAGE';
  imageHash: string | null;
  scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageTransform?: Transform;
  scalingFactor?: number;
  rotation?: number;
  filters?: ImageFilters;
  opacity?: number;
  visible?: boolean;
}

// Create image paint
const imageData: Uint8Array = /* load image bytes */;
const image = figma.createImage(imageData);
node.fills = [{
  type: 'IMAGE',
  imageHash: image.hash,
  scaleMode: 'FILL',
}];
```

---

## Effects

```typescript
type Effect = DropShadowEffect | InnerShadowEffect | BlurEffect | BackgroundBlurEffect;

interface DropShadowEffect {
  type: 'DROP_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;
  spread?: number;
  visible: boolean;
  blendMode: BlendMode;
  showShadowBehindNode?: boolean;
}

interface InnerShadowEffect {
  type: 'INNER_SHADOW';
  color: RGBA;
  offset: Vector;
  radius: number;
  spread?: number;
  visible: boolean;
  blendMode: BlendMode;
}

interface BlurEffect {
  type: 'LAYER_BLUR';
  radius: number;
  visible: boolean;
}

interface BackgroundBlurEffect {
  type: 'BACKGROUND_BLUR';
  radius: number;
  visible: boolean;
}

// Example
node.effects = [
  {
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: 0, y: 4 },
    radius: 8,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  }
];
```

---

## Auto Layout

```typescript
// Enable auto layout
frame.layoutMode = 'VERTICAL';  // or 'HORIZONTAL'

// Direction and alignment
frame.primaryAxisAlignItems = 'CENTER';     // Main axis: MIN, CENTER, MAX, SPACE_BETWEEN
frame.counterAxisAlignItems = 'CENTER';     // Cross axis: MIN, CENTER, MAX, BASELINE

// Sizing
frame.primaryAxisSizingMode = 'AUTO';       // FIXED or AUTO (hug)
frame.counterAxisSizingMode = 'AUTO';       // FIXED or AUTO (hug)

// Padding
frame.paddingTop = 16;
frame.paddingBottom = 16;
frame.paddingLeft = 16;
frame.paddingRight = 16;

// Gap between items
frame.itemSpacing = 8;

// Wrap (if supported)
frame.layoutWrap = 'WRAP';  // or 'NO_WRAP'

// Child properties (when parent has auto layout)
child.layoutPositioning = 'AUTO';           // or 'ABSOLUTE'
child.layoutAlign = 'STRETCH';              // INHERIT, STRETCH, MIN, CENTER, MAX
child.layoutGrow = 1;                       // Flex grow

// Fill container
child.layoutSizingHorizontal = 'FILL';      // FIXED, HUG, or FILL
child.layoutSizingVertical = 'HUG';
```

---

## Styles

```typescript
// Get existing styles
const paintStyles = figma.getLocalPaintStyles();
const textStyles = figma.getLocalTextStyles();
const effectStyles = figma.getLocalEffectStyles();

// Create paint style
const style = figma.createPaintStyle();
style.name = 'Brand/Primary';
style.paints = [{ type: 'SOLID', color: { r: 0, g: 0.5, b: 1 } }];

// Apply style to node
node.fillStyleId = style.id;

// Create text style
const textStyle = figma.createTextStyle();
textStyle.name = 'Heading/H1';
textStyle.fontName = { family: 'Inter', style: 'Bold' };
textStyle.fontSize = 32;
textStyle.lineHeight = { value: 40, unit: 'PIXELS' };

// Apply text style
textNode.textStyleId = textStyle.id;

// Create effect style
const effectStyle = figma.createEffectStyle();
effectStyle.name = 'Shadow/Medium';
effectStyle.effects = [
  {
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.15 },
    offset: { x: 0, y: 4 },
    radius: 12,
    visible: true,
    blendMode: 'NORMAL',
  }
];

// Apply effect style
node.effectStyleId = effectStyle.id;
```

---

## Variables (Design Tokens)

```typescript
// Get variables
const variables = figma.variables.getLocalVariables();
const collections = figma.variables.getLocalVariableCollections();

// Create collection
const collection = figma.variables.createVariableCollection('Colors');

// Add mode (for themes)
const darkModeId = collection.addMode('Dark');
const lightModeId = collection.defaultModeId;  // Already exists

// Create variable
const primaryColor = figma.variables.createVariable(
  'color/primary',
  collection.id,
  'COLOR'
);

// Set values per mode
primaryColor.setValueForMode(lightModeId, { r: 0, g: 0.5, b: 1 });
primaryColor.setValueForMode(darkModeId, { r: 0.3, g: 0.7, b: 1 });

// Bind variable to node
node.setBoundVariable('fills', primaryColor.id);

// Variable types
type VariableResolvedDataType =
  | 'BOOLEAN'
  | 'FLOAT'
  | 'STRING'
  | 'COLOR';
```

---

## Events

```typescript
// Selection changed
figma.on('selectionchange', () => {
  console.log('Selection:', figma.currentPage.selection);
});

// Page changed
figma.on('currentpagechange', () => {
  console.log('Current page:', figma.currentPage.name);
});

// Document changed (for tracking specific changes)
figma.on('documentchange', (event) => {
  for (const change of event.documentChanges) {
    console.log(change.type, change.id);
  }
});

// Plugin close
figma.on('close', () => {
  // Cleanup
});

// Drop event (drag and drop onto canvas)
figma.on('drop', (event) => {
  const { items, dropMetadata } = event;
  // items: dropped files/data
  // dropMetadata: position info
  return false;  // Return false to let Figma handle it, true to cancel
});

// Timer events (use setTimeout/setInterval carefully)
// Available but can block UI - use sparingly

// Remove listener
const handler = () => {};
figma.on('selectionchange', handler);
figma.off('selectionchange', handler);

// Once (auto-removes after first call)
figma.once('selectionchange', () => {
  console.log('First selection change only');
});
```

---

## Export

```typescript
// Export settings
interface ExportSettings {
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  suffix?: string;
  contentsOnly?: boolean;
  constraint?: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT';
    value: number;
  };
}

// Export node
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 },  // 2x
});

// Export as SVG string
const svgString = await node.exportAsync({ format: 'SVG' });
const svg = String.fromCharCode(...svgString);

// Send to UI for download
figma.ui.postMessage({
  type: 'export',
  data: Array.from(bytes),
  filename: `${node.name}.png`,
});
```

---

## Helpers

### Figma Mixed

```typescript
// When a property has different values across selection
if (textNode.fontSize === figma.mixed) {
  // Multiple font sizes in this text node
  console.log('Mixed font sizes');
} else {
  console.log('Font size:', textNode.fontSize);
}
```

### Clone

```typescript
// Clone a node
const clone = node.clone();

// Clone returns same type
const rectClone = rectangleNode.clone();  // RectangleNode
```

### Find Nodes

```typescript
// Find all text nodes in page
const textNodes = figma.currentPage.findAll(
  (node) => node.type === 'TEXT'
) as TextNode[];

// Find first frame with name
const header = figma.currentPage.findOne(
  (node) => node.type === 'FRAME' && node.name === 'Header'
) as FrameNode | null;

// Find by type (faster)
const allFrames = figma.currentPage.findAllWithCriteria({
  types: ['FRAME']
});

// Find children (direct only)
const directTextChildren = parentFrame.findChildren(
  (node) => node.type === 'TEXT'
);
```

### Absolute Position

```typescript
// Get absolute position (relative to page)
const absoluteX = node.absoluteTransform[0][2];
const absoluteY = node.absoluteTransform[1][2];

// Or use absoluteBoundingBox
const bounds = node.absoluteBoundingBox;
if (bounds) {
  console.log(bounds.x, bounds.y, bounds.width, bounds.height);
}
```
