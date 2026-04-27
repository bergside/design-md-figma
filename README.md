# DESIGN.md generator for Figma - TypeUI

<img width="1200" height="630" alt="Group 244" src="https://github.com/user-attachments/assets/48d1aca5-2dca-4a73-b634-1e0bf844d849" />

<br/>

This Figma plugin extracts local styles and system signals from the current file and generates editable `DESIGN.md` and `SKILL.md` outputs that you can use with tools such as Google Stitch, Claude Code, Codex, and others to build interfaces with a consistent design-system blueprint. The generated files are based on the open-source [TypeUI DESIGN.md](https://www.typeui.sh/design-md) format.

## Getting started

Load the plugin in Figma Desktop:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build the plugin:

   ```bash
   npm run build
   ```

3. In Figma Desktop:
   - Open **Plugins -> Development -> Import plugin from manifest...**
   - Select `manifest.json` from this project
   - Run **Design MD Skill Generator**

## Curated design skills

Check out curated design systems at [typeui.sh/design-skills](https://www.typeui.sh/design-skills).

## Available actions

| Action | Description |
| --- | --- |
| Auto-extract | Reads local styles and variables from the active Figma file (colors, typography, spacing, radius, effects, grids, component families). |
| Generate `DESIGN.md` | Produces editable design-guideline markdown from extracted file signals. |
| Generate `SKILL.md` | Produces editable agent-ready markdown from extracted file signals. |
| Toggle view | Switches between `DESIGN.md` and `SKILL.md` in a single editor panel. |
| Refresh | Re-runs extraction for the current Figma file state. |
| Download | Saves generated output as `DESIGN.md` or `SKILL.md`. |

## Generated file structure

The plugin generates two markdown files with consistent structure.

### `DESIGN.md`

| Section | What it does |
| --- | --- |
| `Source` | Captures file/page origin and extraction timestamp. |
| `Variable Collections` | Lists local Figma variable collections used for tokens. |
| `Color Tokens` | Lists extracted paint styles and color variables. |
| `Typography Tokens` | Lists extracted text styles and type scales. |
| `Spacing / Radius / Motion Tokens` | Lists layout and motion-related token signals. |
| `Effect Styles` | Lists shadows, blur, and effect style signals. |
| `Grid Styles` | Lists extracted layout grid definitions. |
| `Component Families` | Lists discovered component-set family names. |

### `SKILL.md`

| Section | What it does |
| --- | --- |
| `Mission` | Defines the design-system objective for the extracted Figma file. |
| `Brand` | Captures product/brand context, audience, and product surface. |
| `Style Foundations` | Lists inferred visual tokens and foundations. |
| `Accessibility` | Applies WCAG 2.2 AA requirements and interaction constraints. |
| `Writing Tone` | Sets guidance tone for implementation-ready output. |
| `Rules: Do` | Lists required implementation practices. |
| `Rules: Don't` | Lists anti-patterns and prohibited behavior. |
| `Guideline Authoring Workflow` | Defines ordered guideline authoring steps. |
| `Required Output Structure` | Enforces consistent output sections. |
| `Component Rule Expectations` | Defines required interaction/state details. |
| `Quality Gates` | Adds testable quality and consistency checks. |

## Local development

Common local commands:

```bash
npm run build
npm run watch
npm run typecheck
```

## License

This project is open-source under the MIT License.
