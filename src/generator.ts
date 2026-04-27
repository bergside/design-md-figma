import {
  normalizeList,
  normalizeSkillName,
  REQUIRED_OUTPUT_STRUCTURE,
  resolveProductSurface,
  TYPEUI_SH_MANAGED_END,
  TYPEUI_SH_MANAGED_START
} from "./blueprint";
import { ExtractedStyleGuidelines, SkillFormState } from "./types";

function listToBullets(values: string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

function listToBulletsOrFallback(values: string[], fallback: string): string {
  if (!values.length) {
    return `- ${fallback}`;
  }

  return listToBullets(values);
}

function numberToList(values: string[]): string {
  return values.map((value, idx) => `${idx + 1}. ${value}`).join("\n");
}

export function generateSkillMarkdown(state: SkillFormState): string {
  const skillName = normalizeSkillName(state.skillNameScope) || "brand-or-scope";
  const productSurface = resolveProductSurface(state);

  const componentFamilies = normalizeList(state.componentFamilies);
  const doRules = normalizeList(state.rulesDo);
  const dontRules = normalizeList(state.rulesDont);
  const workflow = normalizeList(state.workflow);
  const qualityGates = normalizeList(state.qualityGates);
  const typographyTokens = normalizeList(state.typographyScale);
  const colorTokens = normalizeList(state.colorPalette);
  const spacingTokens = normalizeList(state.spacingScale);
  const motionTokens = normalizeList(state.motionTokens);

  const typeUiNote = state.includeTypeUiNote
    ? [
        "## TypeUI + Agentic Integration",
        "This `SKILL.md` is intended for `typeui.sh` CLI workflows.",
        "It can later be integrated with agentic tools including Claude Code, OpenCode, Gemini CLI, Cursor, and similar assistants."
      ].join("\n")
    : "";

  const markdown = [
    "---",
    `name: design-system-${skillName}`,
    `description: ${state.skillDescription.trim()}`,
    "---",
    "",
    TYPEUI_SH_MANAGED_START,
    "",
    `# ${state.designSystemName.trim()}`,
    "",
    "## Mission",
    state.mission.trim(),
    "",
    "## Brand",
    `- Product/brand: ${state.brandName.trim()}`,
    `- Audience: ${state.audience.trim()}`,
    `- Product surface: ${productSurface}`,
    "",
    "## Style Foundations",
    `- Visual style: ${state.visualStyle.trim()}`,
    `- Typography scale: ${typographyTokens.join(", ")}`,
    `- Color palette: ${colorTokens.join(", ")}`,
    `- Spacing scale: ${spacingTokens.join(", ")}`,
    `- Radius/shadow/motion tokens: ${motionTokens.join(", ")}`,
    "",
    "## Component Families",
    listToBullets(componentFamilies),
    "",
    "## Accessibility",
    `- Target: ${state.accessibilityTarget.trim()}`,
    "- Keyboard-first interactions required",
    "- Focus-visible rules required",
    "- Contrast constraints required",
    "",
    "## Writing Tone",
    state.writingTone.trim(),
    "",
    "## Rules: Do",
    listToBullets(doRules),
    "",
    "## Rules: Don't",
    listToBullets(dontRules),
    "",
    "## Guideline Authoring Workflow",
    numberToList(workflow),
    "",
    "## Required Output Structure",
    listToBullets(REQUIRED_OUTPUT_STRUCTURE),
    "",
    "## Component Rule Expectations",
    "- Include keyboard, pointer, and touch behavior.",
    "- Include spacing and typography token requirements.",
    "- Include long-content, overflow, and empty-state handling.",
    "",
    "## Quality Gates",
    listToBullets(qualityGates),
    "",
    "## Acceptance Checklist",
    "- Frontmatter exists with valid `name` and `description`.",
    "- Guidance is under 500 lines for `skill.md` when possible.",
    "- Accessibility and interaction states are explicitly documented.",
    "- Rules are concrete, testable, and non-ambiguous.",
    "- Output can be reused in other repositories with only variable replacement.",
    "",
    typeUiNote,
    "",
    TYPEUI_SH_MANAGED_END,
    ""
  ]
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n");

  return markdown.trimEnd() + "\n";
}

export function generateDesignMarkdown(guidelines: ExtractedStyleGuidelines): string {
  const normalizedName = normalizeSkillName(guidelines.fileName) || "design-system";

  const markdown = [
    "---",
    `name: ${normalizedName}`,
    `source_file: ${guidelines.fileName}`,
    `source_page: ${guidelines.pageName}`,
    `generated_at: ${guidelines.extractedAt}`,
    "---",
    "",
    `# ${guidelines.fileName} Design Guidelines`,
    "",
    "## Source",
    `- Figma file: ${guidelines.fileName}`,
    `- Figma page: ${guidelines.pageName}`,
    `- Extracted at: ${guidelines.extractedAt}`,
    "",
    "## Variable Collections",
    listToBulletsOrFallback(guidelines.variableCollections, "No local variable collections found."),
    "",
    "## Color Tokens",
    listToBulletsOrFallback(guidelines.colorTokens, "No local paint styles or color variables found."),
    "",
    "## Typography Tokens",
    listToBulletsOrFallback(guidelines.typographyTokens, "No local text styles found."),
    "",
    "## Spacing Tokens",
    listToBulletsOrFallback(guidelines.spacingTokens, "No spacing variables found."),
    "",
    "## Radius Tokens",
    listToBulletsOrFallback(guidelines.radiusTokens, "No radius variables found."),
    "",
    "## Motion Tokens",
    listToBulletsOrFallback(guidelines.motionTokens, "No motion variables found."),
    "",
    "## Effect Styles",
    listToBulletsOrFallback(guidelines.effectTokens, "No local effect styles found."),
    "",
    "## Grid Styles",
    listToBulletsOrFallback(guidelines.gridTokens, "No local grid styles found."),
    "",
    "## Component Families",
    listToBulletsOrFallback(
      guidelines.componentFamilies,
      "No components were found on the current page. Add component sets to improve guideline coverage."
    ),
    "",
    "## Editing Notes",
    "- Refine this file after extraction to add brand context and rationale.",
    "- Keep token names synchronized with Figma styles and variables.",
    "- Add usage examples and anti-patterns for critical components.",
    ""
  ]
    .filter((line, idx, arr) => !(line === "" && arr[idx - 1] === ""))
    .join("\n");

  return markdown.trimEnd() + "\n";
}
