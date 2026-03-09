---
name: figma-plugin
description: Use when building Figma plugins, creating design automation tools, implementing sandbox/UI communication, or working with the Figma Plugin API for node manipulation, styles, and components.
---

# Figma Plugin Development

Build plugins that extend Figma's functionality using the Plugin API.

## Architecture

Figma plugins run in two threads communicating via postMessage:
- **Main thread (sandbox)**: Plugin API access, node manipulation, `figma.*` calls
- **UI thread (iframe)**: HTML/CSS/JS interface, no Figma API access, npm packages allowed

## Key Principles

- Main thread handles all Figma document operations
- UI thread handles user interface and external APIs
- Communication between threads via `figma.ui.postMessage()` and `onmessage`
- Plugins must be performant — avoid blocking the main thread

## Quick Start Checklist

1. Set up project with `manifest.json` (name, id, main, ui)
2. Create main thread code (`code.ts`) with plugin logic
3. Create UI (`ui.html`) with interface elements
4. Wire up postMessage communication between threads
5. Test in Figma development mode
6. Publish via Figma Community

## References

| Reference | Description |
|-----------|-------------|
| [project-structure-and-build.md](references/project-structure-and-build.md) | Manifest, TypeScript setup, build configuration |
| [development-testing-and-publishing.md](references/development-testing-and-publishing.md) | Dev workflow, testing, publishing, troubleshooting |
| [api-globals-and-nodes.md](references/api-globals-and-nodes.md) | Global objects, node types, components |
| [api-rendering-and-advanced.md](references/api-rendering-and-advanced.md) | Paints, effects, auto layout, styles, variables, events |
| [ui-architecture-and-messaging.md](references/ui-architecture-and-messaging.md) | iframe UI, postMessage, typed messages, plain HTML |
| [ui-react-and-theming.md](references/ui-react-and-theming.md) | React setup, hooks, Figma theme colors |
| [ui-patterns-and-resources.md](references/ui-patterns-and-resources.md) | Loading states, tabs, color pickers, file downloads |
| [selection-traversal-and-batching.md](references/selection-traversal-and-batching.md) | Selection handling, node traversal, batch operations |
| [colors-and-text.md](references/colors-and-text.md) | Color conversion, manipulation, text operations |
| [layout-storage-and-utilities.md](references/layout-storage-and-utilities.md) | Positioning, alignment, storage, error handling, utilities |
