# Colors and Text

Utilities for color conversion, manipulation, and text operations.

## Working with Colors

### Color Conversion Utilities

```typescript
// Hex to RGB (Figma format: 0-1)
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

// RGB to Hex
function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

// HSL to RGB
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return { r, g, b };
}

// Get solid fill color
function getSolidFillColor(node: GeometryMixin): RGB | null {
  const fills = node.fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return null;

  const solidFill = fills.find((f): f is SolidPaint => f.type === 'SOLID');
  return solidFill?.color ?? null;
}

// Set solid fill
function setSolidFill(node: GeometryMixin, color: RGB, opacity?: number): void {
  node.fills = [{
    type: 'SOLID',
    color,
    opacity: opacity ?? 1,
  }];
}
```

### Color Manipulation

```typescript
// Lighten/darken color
function adjustBrightness(color: RGB, amount: number): RGB {
  return {
    r: Math.max(0, Math.min(1, color.r + amount)),
    g: Math.max(0, Math.min(1, color.g + amount)),
    b: Math.max(0, Math.min(1, color.b + amount)),
  };
}

// Calculate contrast ratio (for accessibility)
function getContrastRatio(color1: RGB, color2: RGB): number {
  const luminance = (c: RGB) => {
    const [r, g, b] = [c.r, c.g, c.b].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}
```

---

## Working with Text

### Safe Text Operations

```typescript
// Load font before modifying text
async function setTextContent(node: TextNode, text: string): Promise<void> {
  // Load all fonts used in the text node
  if (node.fontName !== figma.mixed) {
    await figma.loadFontAsync(node.fontName);
  } else {
    // Mixed fonts - load all unique fonts
    const fonts = new Set<string>();
    const len = node.characters.length;

    for (let i = 0; i < len; i++) {
      const font = node.getRangeFontName(i, i + 1);
      if (font !== figma.mixed) {
        fonts.add(JSON.stringify(font));
      }
    }

    await Promise.all(
      [...fonts].map(f => figma.loadFontAsync(JSON.parse(f)))
    );
  }

  node.characters = text;
}

// Create text node with font
async function createText(
  text: string,
  font: FontName = { family: 'Inter', style: 'Regular' },
  fontSize: number = 14
): Promise<TextNode> {
  const node = figma.createText();
  await figma.loadFontAsync(font);
  node.fontName = font;
  node.fontSize = fontSize;
  node.characters = text;
  return node;
}
```

### Text Style Application

```typescript
// Apply text style to range
async function styleTextRange(
  node: TextNode,
  start: number,
  end: number,
  style: {
    fontName?: FontName;
    fontSize?: number;
    fills?: Paint[];
    textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  }
): Promise<void> {
  if (style.fontName) {
    await figma.loadFontAsync(style.fontName);
    node.setRangeFontName(start, end, style.fontName);
  }

  if (style.fontSize) {
    node.setRangeFontSize(start, end, style.fontSize);
  }

  if (style.fills) {
    node.setRangeFills(start, end, style.fills);
  }

  if (style.textDecoration) {
    node.setRangeTextDecoration(start, end, style.textDecoration);
  }
}
```
