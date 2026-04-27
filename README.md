# Figma Design Guideline Extractor Plugin

This plugin automatically extracts local Figma design foundations (styles, variables, and component families) and generates two editable markdown drafts:

- `DESIGN.md`
- `SKILL.md`

Both outputs can be edited directly inside the plugin, copied to clipboard, or downloaded.

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
   - Run **Design MD Skill Generator**.

## Usage

1. Open any Figma file with local styles/variables.
2. Run the plugin.
3. The plugin extracts guidelines automatically.
4. Edit the generated `DESIGN.md` and `SKILL.md` content.
5. Copy or download each file.

## Development

- Build once: `npm run build`
- Watch mode: `npm run watch`
- Typecheck: `npm run typecheck`
