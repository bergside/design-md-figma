import { normalizeSkillName } from "./blueprint";
import { DEFAULT_FORM_STATE, ExtractedStyleGuidelines, ExtractionResult, ProductSurface, SkillFormState } from "./types";

const MAX_ITEMS_PER_SECTION = 40;
const MAX_FORM_ITEMS = 14;

interface VariableExtraction {
  colorTokens: string[];
  spacingTokens: string[];
  radiusTokens: string[];
  motionTokens: string[];
  collections: string[];
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const rawItem of items) {
    const item = rawItem.trim();
    if (!item) {
      continue;
    }
    if (seen.has(item)) {
      continue;
    }
    seen.add(item);
    output.push(item);
  }

  return output;
}

function limit(items: string[], max = MAX_ITEMS_PER_SECTION): string[] {
  return items.slice(0, max);
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function toHexChannel(value: number): string {
  const normalized = Math.max(0, Math.min(255, Math.round(value * 255)));
  return normalized.toString(16).padStart(2, "0").toUpperCase();
}

function toHexOpacity(opacity: number): string {
  const normalized = Math.max(0, Math.min(255, Math.round(opacity * 255)));
  return normalized.toString(16).padStart(2, "0").toUpperCase();
}

function formatRgb(color: RGB | RGBA, opacityOverride?: number): string {
  const base = `#${toHexChannel(color.r)}${toHexChannel(color.g)}${toHexChannel(color.b)}`;
  const alpha = typeof opacityOverride === "number" ? opacityOverride : "a" in color ? color.a : 1;

  if (alpha >= 0.999) {
    return base;
  }

  return `${base}${toHexOpacity(alpha)}`;
}

function formatPaint(paint: Paint): string {
  switch (paint.type) {
    case "SOLID":
      return formatRgb(paint.color, paint.opacity);
    case "GRADIENT_LINEAR":
    case "GRADIENT_RADIAL":
    case "GRADIENT_ANGULAR":
    case "GRADIENT_DIAMOND": {
      const stops = paint.gradientStops.slice(0, 3).map((stop) => `${formatRgb(stop.color)} ${Math.round(stop.position * 100)}%`);
      const suffix = paint.gradientStops.length > 3 ? ", ..." : "";
      return `${paint.type.toLowerCase()}(${stops.join(" | ")}${suffix})`;
    }
    case "IMAGE":
      return "image";
    case "VIDEO":
      return "video";
    case "PATTERN":
      return "pattern";
    default:
      return assertNever(paint);
  }
}

function formatPaintStyle(style: PaintStyle): string {
  if (!style.paints.length) {
    return `${style.name}: none`;
  }

  const paints = style.paints.slice(0, 2).map((paint) => formatPaint(paint));
  const suffix = style.paints.length > 2 ? " + ..." : "";
  return `${style.name}: ${paints.join(" + ")}${suffix}`;
}

function formatLineHeight(lineHeight: LineHeight): string {
  if (lineHeight.unit === "AUTO") {
    return "auto";
  }

  if (lineHeight.unit === "PIXELS") {
    return `${formatNumber(lineHeight.value)}px`;
  }

  return `${formatNumber(lineHeight.value)}%`;
}

function formatLetterSpacing(letterSpacing: LetterSpacing): string {
  if (letterSpacing.unit === "PIXELS") {
    return `${formatNumber(letterSpacing.value)}px`;
  }

  return `${formatNumber(letterSpacing.value)}%`;
}

function formatTextStyle(style: TextStyle): string {
  const fontLabel = `${style.fontName.family} ${style.fontName.style}`;
  const lineHeight = formatLineHeight(style.lineHeight);
  const letterSpacing = formatLetterSpacing(style.letterSpacing);
  return `${style.name}: ${fontLabel}, ${formatNumber(style.fontSize)}px / ${lineHeight}, tracking ${letterSpacing}`;
}

function formatEffect(effect: Effect): string {
  switch (effect.type) {
    case "DROP_SHADOW":
    case "INNER_SHADOW": {
      const offset = `${formatNumber(effect.offset.x)} ${formatNumber(effect.offset.y)}`;
      const color = formatRgb(effect.color);
      return `${effect.type.toLowerCase()} ${formatNumber(effect.radius)}px offset ${offset} ${color}`;
    }
    case "LAYER_BLUR":
    case "BACKGROUND_BLUR":
      return `${effect.type.toLowerCase()} ${formatNumber(effect.radius)}px`;
    case "NOISE":
      return "noise";
    case "TEXTURE":
      return "texture";
    case "GLASS":
      return "glass";
    default:
      return assertNever(effect);
  }
}

function formatEffectStyle(style: EffectStyle): string {
  if (!style.effects.length) {
    return `${style.name}: none`;
  }

  const effects = style.effects.slice(0, 2).map((effect) => formatEffect(effect));
  const suffix = style.effects.length > 2 ? " + ..." : "";
  return `${style.name}: ${effects.join(" + ")}${suffix}`;
}

function formatGrid(grid: LayoutGrid): string {
  if (grid.pattern === "GRID") {
    return `grid ${formatNumber(grid.sectionSize)}px`;
  }

  const count = Number.isFinite(grid.count) ? formatNumber(grid.count) : "auto";
  const section = typeof grid.sectionSize === "number" ? `${formatNumber(grid.sectionSize)}px` : "auto";
  const gutter = `${formatNumber(grid.gutterSize)}px`;
  return `${grid.pattern.toLowerCase()} count ${count}, section ${section}, gutter ${gutter}, align ${grid.alignment.toLowerCase()}`;
}

function formatGridStyle(style: GridStyle): string {
  if (!style.layoutGrids.length) {
    return `${style.name}: none`;
  }

  const grids = style.layoutGrids.slice(0, 2).map((grid) => formatGrid(grid));
  const suffix = style.layoutGrids.length > 2 ? " + ..." : "";
  return `${style.name}: ${grids.join(" + ")}${suffix}`;
}

function isVariableAlias(value: VariableValue): value is VariableAlias {
  return typeof value === "object" && value !== null && "type" in value && value.type === "VARIABLE_ALIAS";
}

function isColorValue(value: VariableValue): value is RGB | RGBA {
  return typeof value === "object" && value !== null && "r" in value && "g" in value && "b" in value;
}

function formatVariableValue(value: VariableValue, variableNameById: Map<string, string>): string {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string") {
    return value;
  }

  if (isVariableAlias(value)) {
    const aliasName = variableNameById.has(value.id) ? variableNameById.get(value.id)! : value.id;
    return `alias(${aliasName})`;
  }

  if (isColorValue(value)) {
    return formatRgb(value);
  }

  return "unknown";
}

function toTokenName(line: string): string {
  const [name] = line.split(":");
  return name.trim();
}

function inferProductSurface(fileName: string): ProductSurface {
  const normalized = fileName.toLowerCase();

  if (/(marketing|landing|website)/.test(normalized)) {
    return "marketing site";
  }

  if (/(dashboard|admin|portal|analytics)/.test(normalized)) {
    return "dashboard";
  }

  if (/(mobile|ios|android|app)/.test(normalized)) {
    return "mobile web";
  }

  return "web app";
}

function inferVisualStyle(guidelines: ExtractedStyleGuidelines): string {
  const hasRichEffects = guidelines.effectTokens.length > 0;
  const hasGrid = guidelines.gridTokens.length > 0;
  const hasVariables = guidelines.variableCollections.length > 0;

  if (hasRichEffects && hasGrid) {
    return "structured, token-driven, layered";
  }

  if (hasVariables && hasGrid) {
    return "systematic, token-driven, structured";
  }

  if (hasRichEffects) {
    return "token-driven, expressive, polished";
  }

  return "clean, token-driven, functional";
}

function listToCsv(values: string[], fallback: string): string {
  if (!values.length) {
    return fallback;
  }

  return values.join(", ");
}

function buildSkillFormState(guidelines: ExtractedStyleGuidelines): SkillFormState {
  const colorNames = guidelines.colorTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);
  const typographyNames = guidelines.typographyTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);
  const spacingNames = guidelines.spacingTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);
  const radiusNames = guidelines.radiusTokens.map((line) => toTokenName(line)).slice(0, 4);
  const motionNames = guidelines.motionTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);

  const spacingScale = spacingNames.length
    ? spacingNames
    : guidelines.gridTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);

  const motionScale = motionNames.length
    ? motionNames
    : guidelines.effectTokens.map((line) => toTokenName(line)).slice(0, MAX_FORM_ITEMS);

  const rulesDo = [
    colorNames.length
      ? `Use extracted color tokens before introducing one-off values: ${colorNames.slice(0, 6).join(", ")}.`
      : "Use semantic color tokens instead of raw color values.",
    typographyNames.length
      ? `Use these typography styles consistently: ${typographyNames.slice(0, 6).join(", ")}.`
      : "Use shared typography styles for headings, body text, and labels.",
    "Define all interaction states for interactive components: default, hover, focus-visible, active, disabled, and loading."
  ].join("\n");

  const rulesDont = [
    "Do not duplicate existing style tokens with one-off naming.",
    "Do not remove focus-visible indicators or keyboard support.",
    "Do not hard-code raw values where local styles or variables already exist."
  ].join("\n");

  const radiusChunk = radiusNames.length ? `, radius ${radiusNames.join("/")}` : "";

  return {
    skillNameScope: normalizeSkillName(guidelines.fileName) || DEFAULT_FORM_STATE.skillNameScope,
    skillDescription: `Creates implementation-ready design-system guidance derived from local Figma styles in \"${guidelines.fileName}\".`,
    designSystemName: guidelines.fileName || DEFAULT_FORM_STATE.designSystemName,
    mission: `Document and operationalize the ${guidelines.fileName} style foundations extracted from Figma so teams can build consistent interfaces quickly.`,
    brandName: guidelines.fileName || DEFAULT_FORM_STATE.brandName,
    audience: "Designers and engineers building this product",
    productSurface: inferProductSurface(guidelines.fileName),
    productSurfaceOther: "",
    visualStyle: `${inferVisualStyle(guidelines)}${radiusChunk}`,
    typographyScale: listToCsv(typographyNames, DEFAULT_FORM_STATE.typographyScale),
    colorPalette: listToCsv(colorNames, DEFAULT_FORM_STATE.colorPalette),
    spacingScale: listToCsv(spacingScale, DEFAULT_FORM_STATE.spacingScale),
    motionTokens: listToCsv(motionScale, DEFAULT_FORM_STATE.motionTokens),
    componentFamilies: listToCsv(guidelines.componentFamilies.slice(0, MAX_FORM_ITEMS), DEFAULT_FORM_STATE.componentFamilies),
    accessibilityTarget: DEFAULT_FORM_STATE.accessibilityTarget,
    writingTone: DEFAULT_FORM_STATE.writingTone,
    rulesDo,
    rulesDont,
    workflow: DEFAULT_FORM_STATE.workflow,
    qualityGates: DEFAULT_FORM_STATE.qualityGates,
    includeTypeUiNote: true
  };
}

function isSpacingVariable(variable: Variable): boolean {
  if (variable.scopes.includes("GAP")) {
    return true;
  }

  return /(^|[\/_\-\s])(space|spacing|gap|padding|margin|inset|stack|grid)([\/_\-\s]|$)/i.test(variable.name);
}

function isRadiusVariable(variable: Variable): boolean {
  if (variable.scopes.includes("CORNER_RADIUS")) {
    return true;
  }

  return /(^|[\/_\-\s])(radius|corner|round)([\/_\-\s]|$)/i.test(variable.name);
}

function isMotionVariable(variable: Variable): boolean {
  if (variable.scopes.includes("EFFECT_FLOAT")) {
    return true;
  }

  return /(^|[\/_\-\s])(motion|duration|timing|easing|ease|animation|transition)([\/_\-\s]|$)/i.test(variable.name);
}

async function extractVariables(): Promise<VariableExtraction> {
  const [variables, collections] = await Promise.all([
    figma.variables.getLocalVariablesAsync(),
    figma.variables.getLocalVariableCollectionsAsync()
  ]);

  const collectionNameById = new Map<string, string>(collections.map((collection) => [collection.id, collection.name]));
  const variableNameById = new Map<string, string>(variables.map((variable) => [variable.id, variable.name]));

  const colorTokens: string[] = [];
  const spacingTokens: string[] = [];
  const radiusTokens: string[] = [];
  const motionTokens: string[] = [];

  for (const variable of variables) {
    const modeIds = Object.keys(variable.valuesByMode);
    const firstModeId = modeIds[0];
    if (!firstModeId) {
      continue;
    }

    const rawValue = variable.valuesByMode[firstModeId];
    const collectionName = collectionNameById.get(variable.variableCollectionId);
    const fullName = collectionName ? `${collectionName}/${variable.name}` : variable.name;
    const value = formatVariableValue(rawValue, variableNameById);
    const tokenLine = `${fullName}: ${value}`;

    if (variable.resolvedType === "COLOR") {
      colorTokens.push(tokenLine);
      continue;
    }

    if (variable.resolvedType === "FLOAT") {
      if (isMotionVariable(variable)) {
        motionTokens.push(tokenLine);
        continue;
      }

      if (isRadiusVariable(variable)) {
        radiusTokens.push(tokenLine);
        continue;
      }

      if (isSpacingVariable(variable)) {
        spacingTokens.push(tokenLine);
      }
      continue;
    }

    if (variable.resolvedType === "STRING" && isMotionVariable(variable)) {
      motionTokens.push(tokenLine);
    }
  }

  return {
    colorTokens: limit(unique(colorTokens)),
    spacingTokens: limit(unique(spacingTokens)),
    radiusTokens: limit(unique(radiusTokens)),
    motionTokens: limit(unique(motionTokens)),
    collections: limit(unique(collections.map((collection) => collection.name)))
  };
}

function extractComponentFamilies(): string[] {
  const componentSets = figma.currentPage.findAllWithCriteria({ types: ["COMPONENT_SET"] });
  const components = figma.currentPage.findAllWithCriteria({ types: ["COMPONENT"] });

  const names = componentSets.map((node) => node.name).concat(components.map((node) => node.name));
  const families = names
    .map((name) => {
      const [family] = name.split("/");
      return family ? family.trim() : "";
    })
    .filter(Boolean);

  return limit(unique(families));
}

export async function extractStyleGuidelines(): Promise<ExtractionResult> {
  const [paintStyles, textStyles, effectStyles, gridStyles, variableExtraction] = await Promise.all([
    figma.getLocalPaintStylesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
    figma.getLocalGridStylesAsync(),
    extractVariables()
  ]);

  const styleGuidelines: ExtractedStyleGuidelines = {
    fileName: figma.root.name,
    pageName: figma.currentPage.name,
    extractedAt: new Date().toISOString(),
    colorTokens: limit(unique(paintStyles.map(formatPaintStyle).concat(variableExtraction.colorTokens))),
    typographyTokens: limit(unique(textStyles.map(formatTextStyle))),
    spacingTokens: limit(unique(variableExtraction.spacingTokens)),
    radiusTokens: limit(unique(variableExtraction.radiusTokens)),
    motionTokens: limit(unique(variableExtraction.motionTokens)),
    effectTokens: limit(unique(effectStyles.map(formatEffectStyle))),
    gridTokens: limit(unique(gridStyles.map(formatGridStyle))),
    componentFamilies: extractComponentFamilies(),
    variableCollections: variableExtraction.collections
  };

  return {
    styleGuidelines,
    formState: buildSkillFormState(styleGuidelines)
  };
}
