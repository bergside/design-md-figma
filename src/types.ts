export type ProductSurface = "web app" | "marketing site" | "dashboard" | "mobile web" | "other";

export interface SkillFormState {
  skillNameScope: string;
  skillDescription: string;
  designSystemName: string;
  mission: string;
  brandName: string;
  audience: string;
  productSurface: ProductSurface;
  productSurfaceOther: string;
  visualStyle: string;
  typographyScale: string;
  colorPalette: string;
  spacingScale: string;
  motionTokens: string;
  componentFamilies: string;
  accessibilityTarget: string;
  writingTone: string;
  rulesDo: string;
  rulesDont: string;
  workflow: string;
  qualityGates: string;
  includeTypeUiNote: boolean;
}

export interface ExtractedStyleGuidelines {
  fileName: string;
  pageName: string;
  extractedAt: string;
  colorTokens: string[];
  typographyTokens: string[];
  spacingTokens: string[];
  radiusTokens: string[];
  motionTokens: string[];
  effectTokens: string[];
  gridTokens: string[];
  componentFamilies: string[];
  variableCollections: string[];
}

export interface ExtractionResult {
  styleGuidelines: ExtractedStyleGuidelines;
  formState: SkillFormState;
}

export type UIToMainMessage =
  | { type: "close-plugin" }
  | { type: "resize-ui"; width: number; height: number }
  | { type: "extract-guidelines" };

export type MainToUIMessage =
  | { type: "extraction-started" }
  | { type: "extraction-success"; payload: ExtractionResult }
  | { type: "extraction-error"; error: string };

export const DEFAULT_FORM_STATE: SkillFormState = {
  skillNameScope: "brand-or-scope",
  skillDescription:
    "Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.",
  designSystemName: "Design System Name",
  mission: "One paragraph describing the system objective and target product experience.",
  brandName: "Brand Name",
  audience: "Primary users",
  productSurface: "web app",
  productSurfaceOther: "",
  visualStyle: "clean, modern, functional",
  typographyScale: "display-xl, display-lg, heading-lg, heading-md, body-lg, body-md, caption-sm",
  colorPalette:
    "text-primary #111827, text-secondary #4B5563, bg-primary #FFFFFF, bg-secondary #F9FAFB, accent-primary #2563EB, success #16A34A, warning #D97706, danger #DC2626",
  spacingScale: "space-0, space-1, space-2, space-3, space-4, space-6, space-8, space-12",
  motionTokens: "duration-fast 120ms, duration-base 200ms, ease-standard",
  componentFamilies: "buttons, inputs, forms, navigation, overlays, feedback, data display",
  accessibilityTarget: "WCAG 2.2 AA",
  writingTone: "concise, confident, implementation-focused",
  rulesDo:
    "Use semantic tokens, not raw hex values in component guidance.\nDefine all required states: default, hover, focus-visible, active, disabled, loading, error.\nSpecify responsive behavior and edge-case handling.",
  rulesDont:
    "Do not allow low-contrast text or hidden focus indicators.\nDo not introduce one-off spacing or typography exceptions.\nDo not use ambiguous labels or non-descriptive actions.",
  workflow:
    "Restate design intent in one sentence.\nDefine foundations and tokens.\nDefine component anatomy, variants, and interactions.\nAdd accessibility acceptance criteria.\nAdd anti-patterns and migration notes.\nEnd with QA checklist.",
  qualityGates:
    "Every non-negotiable rule uses \"must\".\nEvery recommendation uses \"should\".\nEvery accessibility rule is testable in implementation.\nPrefer system consistency over local visual exceptions.",
  includeTypeUiNote: true
};
