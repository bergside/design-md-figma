# Figma Skill Generator Plugin

This plugin provides a guided multi-step form to generate a reusable design-system `SKILL.md` from `DESIGN-SYSTEM-SKILL-BLUEPRINT.md`.

The generated file is intended for `typeui.sh` CLI workflows and can later be integrated with agentic tools such as Claude Code, OpenCode, Gemini CLI, Cursor, and similar assistants.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build plugin assets:

   ```bash
   npm run build
   ```

3. In Figma Desktop:
   - Go to Plugins > Development > Import plugin from manifest...
   - Select `manifest.json` from this repository.
   - Run **Figma Skill Generator**.

## Development

- Build once: `npm run build`
- Watch mode: `npm run watch`
- Typecheck: `npm run typecheck`
