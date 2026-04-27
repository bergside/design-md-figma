---
name: design-system-[brand-or-scope]
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- OPTIONAL MANAGED BLOCK MARKERS -->
<!-- TYPEUI_SH_MANAGED_START -->

# [Design System Name]

## Mission
One paragraph describing the system objective and target product experience.

## Brand
- Product/brand: [name]
- Audience: [primary users]
- Product surface: [web app, marketing site, dashboard, mobile web]

## Style Foundations
- Visual style: [keywords]
- Typography scale: [token list]
- Color palette: [semantic tokens + values]
- Spacing scale: [token list]
- Radius/shadow/motion tokens: [if applicable]

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required
- Contrast constraints required

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Define all required states: default, hover, focus-visible, active, disabled, loading, error.
- Specify responsive behavior and edge-case handling.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule uses "must".
- Every recommendation uses "should".
- Every accessibility rule is testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->