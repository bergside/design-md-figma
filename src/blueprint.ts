import { SkillFormState } from "./types";

export const TYPEUI_SH_MANAGED_START = "<!-- TYPEUI_SH_MANAGED_START -->";
export const TYPEUI_SH_MANAGED_END = "<!-- TYPEUI_SH_MANAGED_END -->";

export const REQUIRED_OUTPUT_STRUCTURE = [
  "Context and goals",
  "Design tokens and foundations",
  "Component-level rules (anatomy, variants, states, responsive behavior)",
  "Accessibility requirements and testable acceptance criteria",
  "Content and tone standards with examples",
  "Anti-patterns and prohibited implementations",
  "QA checklist"
];

export function normalizeList(input: string): string[] {
  return input
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSkillName(scope: string): string {
  return scope
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function resolveProductSurface(state: SkillFormState): string {
  if (state.productSurface !== "other") {
    return state.productSurface;
  }
  return state.productSurfaceOther.trim() || "web app";
}
