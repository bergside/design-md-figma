import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { generateSkillMarkdown } from "./generator";
import { DEFAULT_FORM_STATE, SkillFormState, UIToMainMessage, WizardStep, WizardStepId } from "./types";

const STEPS: WizardStep[] = [
  { id: "identity", title: "Skill Identity" },
  { id: "brand", title: "Brand" },
  { id: "foundations", title: "Foundations" },
  { id: "components", title: "Components" },
  { id: "accessibility", title: "Accessibility" },
  { id: "rules", title: "Rules" },
  { id: "review", title: "Review" }
];

const STEP_FIELDS: Record<WizardStepId, Array<keyof SkillFormState>> = {
  identity: ["skillNameScope", "skillDescription", "designSystemName"],
  brand: ["mission", "brandName", "audience", "productSurface", "productSurfaceOther"],
  foundations: ["visualStyle", "typographyScale", "colorPalette", "spacingScale", "motionTokens"],
  components: ["componentFamilies", "includeTypeUiNote"],
  accessibility: ["accessibilityTarget"],
  rules: ["writingTone", "rulesDo", "rulesDont", "workflow", "qualityGates"],
  review: []
};

function postToMain(message: UIToMainMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

function fallbackCopy(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(textArea);
  return ok;
}

function downloadMarkdown(markdown: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "design-system-skill.md";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function validateStep(stepIndex: number, state: SkillFormState): string | null {
  const requiredByStep: Array<Array<keyof SkillFormState>> = [
    ["skillNameScope", "skillDescription", "designSystemName"],
    ["mission", "brandName", "audience"],
    ["visualStyle", "typographyScale", "colorPalette", "spacingScale"],
    ["componentFamilies"],
    ["accessibilityTarget"],
    ["rulesDo", "rulesDont", "workflow", "qualityGates"],
    [],
    []
  ];

  const keys = requiredByStep[stepIndex] || [];
  const firstInvalid = keys.find((key) => String(state[key]).trim() === "");
  if (firstInvalid) {
    return "Please fill in all required fields before continuing.";
  }

  if (stepIndex === 1 && state.productSurface === "other" && state.productSurfaceOther.trim() === "") {
    return "Please provide a custom product surface.";
  }

  return null;
}

function App() {
  const [stepIndex, setStepIndex] = useState(0);
  const [formState, setFormState] = useState<SkillFormState>(DEFAULT_FORM_STATE);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    postToMain({ type: "resize-ui", width: 520, height: 760 });
  }, []);

  const markdown = useMemo(() => generateSkillMarkdown(formState), [formState]);
  const activeStep = STEPS[stepIndex];

  const setField = <K extends keyof SkillFormState>(key: K, value: SkillFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const randomChoice = <T extends string>(options: readonly T[]): T => options[Math.floor(Math.random() * options.length)];

  const randomizeCurrentStep = () => {
    setFormState((prev) => {
      switch (activeStep.id) {
        case "identity":
          return {
            ...prev,
            skillNameScope: randomChoice(["fintech-web", "saas-dashboard", "commerce-platform", "studio-system"]),
            designSystemName: randomChoice(["Nova Design System", "Atlas UI", "Horizon Components", "Orbit Interface"]),
            skillDescription:
              "Creates implementation-ready design-system guidance with clear tokens, component behavior, and accessibility standards for production teams."
          };
        case "brand":
          return {
            ...prev,
            mission: randomChoice([
              "Provide a cohesive, scalable interface system that accelerates delivery while preserving product quality.",
              "Create a unified product experience across surfaces with reusable, testable UI rules.",
              "Standardize interaction patterns and visual tokens so teams can ship consistent interfaces quickly."
            ]),
            brandName: randomChoice(["Bergside", "Northline", "Aster", "Arcflow"]),
            audience: randomChoice(["Product teams and designers", "SaaS operators and analysts", "Developers and PMs"]),
            productSurface: randomChoice(["web app", "dashboard", "marketing site", "mobile web"] as const)
          };
        case "foundations":
          return {
            ...prev,
            visualStyle: randomChoice([
              "minimal, data-first, neutral",
              "clean, modern, functional",
              "bold, high-contrast, geometric"
            ]),
            typographyScale: randomChoice([
              "display-xl, display-lg, heading-lg, heading-md, body-lg, body-md, caption-sm",
              "hero, title-1, title-2, body-1, body-2, label, caption",
              "h1, h2, h3, h4, body, small, overline"
            ]),
            colorPalette: randomChoice([
              "text-primary #111827, text-secondary #4B5563, bg-primary #FFFFFF, bg-secondary #F9FAFB, accent-primary #2563EB, success #16A34A, warning #D97706, danger #DC2626",
              "text-primary #0F172A, text-secondary #475569, bg-primary #FFFFFF, bg-muted #F8FAFC, accent-primary #7C3AED, success #22C55E, warning #F59E0B, danger #EF4444",
              "text-primary #1F2937, text-secondary #6B7280, bg-primary #FFFFFF, bg-secondary #F3F4F6, accent-primary #0EA5E9, success #10B981, warning #F97316, danger #E11D48"
            ]),
            spacingScale: randomChoice([
              "space-0, space-1, space-2, space-3, space-4, space-6, space-8, space-12",
              "xs, sm, md, lg, xl, 2xl",
              "2, 4, 8, 12, 16, 24, 32, 48"
            ]),
            motionTokens: randomChoice([
              "duration-fast 120ms, duration-base 200ms, ease-standard",
              "duration-fast 100ms, duration-medium 180ms, duration-slow 260ms, ease-emphasized",
              "motion-none, motion-subtle 140ms, motion-default 220ms"
            ])
          };
        case "components":
          return {
            ...prev,
            componentFamilies: randomChoice([
              "buttons, inputs, forms, navigation, overlays, feedback, data display",
              "buttons, fields, table, tabs, modal, toast, empty state",
              "actions, forms, navigation, cards, data visualization, notifications"
            ]),
            includeTypeUiNote: Math.random() > 0.5
          };
        case "accessibility":
          return {
            ...prev,
            accessibilityTarget: randomChoice(["WCAG 2.2 AA", "WCAG 2.1 AA", "WCAG 2.2 AAA"])
          };
        case "rules":
          return {
            ...prev,
            writingTone: randomChoice([
              "concise, confident, implementation-focused",
              "pragmatic, direct, standards-first",
              "clear, explicit, developer-friendly"
            ]),
            rulesDo:
              "Use semantic tokens, not raw hex values in component guidance.\nDefine all required states: default, hover, focus-visible, active, disabled, loading, error.\nSpecify responsive behavior and edge-case handling.",
            rulesDont:
              "Do not allow low-contrast text or hidden focus indicators.\nDo not introduce one-off spacing or typography exceptions.\nDo not use ambiguous labels or non-descriptive actions.",
            workflow:
              "Restate design intent in one sentence.\nDefine foundations and tokens.\nDefine component anatomy, variants, and interactions.\nAdd accessibility acceptance criteria.\nAdd anti-patterns and migration notes.\nEnd with QA checklist.",
            qualityGates:
              "Every non-negotiable rule uses \"must\".\nEvery recommendation uses \"should\".\nEvery accessibility rule is testable in implementation.\nPrefer system consistency over local visual exceptions."
          };
        case "review":
        default:
          return prev;
      }
    });
    setError(null);
  };

  const resetCurrentStep = () => {
    const fields = STEP_FIELDS[activeStep.id];
    if (!fields.length) {
      return;
    }
    setFormState((prev) => {
      const next = { ...prev };
      for (const field of fields) {
        next[field] = DEFAULT_FORM_STATE[field] as never;
      }
      return next;
    });
    setError(null);
  };

  const goNext = () => {
    const validationError = validateStep(stepIndex, formState);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const copyMarkdown = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else if (!fallbackCopy(markdown)) {
        throw new Error("Fallback copy failed");
      }
      setCopyState("copied");
    } catch (_error) {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1800);
  };

  return (
    <main className="app">
      <header className="header">
        <h1>Figma Skill Generator</h1>
        <p>
          Build a <code>skill.md</code> file for your design system configuration that can be used to share across
          agentic tools like Claude Code, Open Code, Cursor, and more. The configuration is built based on the{" "}
          <a href="https://www.typeui.sh" target="_blank" rel="noreferrer">
            typeui.sh
          </a>{" "}
          configuration.
        </p>
      </header>

      <section className="stepper">
        <div className="step-info">
          <p className="step-current">{activeStep.title}</p>
          <p className="step-meta">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
        <div className="step-tools">
          <button type="button" className="btn" onClick={randomizeCurrentStep} disabled={activeStep.id === "review"}>
            🪄 Randomize
          </button>
          <button type="button" className="btn" onClick={resetCurrentStep} disabled={activeStep.id === "review"}>
            ↻ Reset fields
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>{activeStep.title}</h2>
        {error ? <p className="error">{error}</p> : null}

        {activeStep.id === "identity" && (
          <div className="grid">
            <label>
              Skill name scope
              <input
                value={formState.skillNameScope}
                onChange={(event) => setField("skillNameScope", event.target.value)}
                placeholder="brand-or-scope"
              />
            </label>
            <label>
              Design system name
              <input
                value={formState.designSystemName}
                onChange={(event) => setField("designSystemName", event.target.value)}
              />
            </label>
            <label>
              Skill description
              <textarea
                value={formState.skillDescription}
                onChange={(event) => setField("skillDescription", event.target.value)}
                rows={4}
              />
            </label>
          </div>
        )}

        {activeStep.id === "brand" && (
          <div className="grid">
            <label>
              Mission
              <textarea value={formState.mission} onChange={(event) => setField("mission", event.target.value)} rows={4} />
            </label>
            <label>
              Product/brand
              <input value={formState.brandName} onChange={(event) => setField("brandName", event.target.value)} />
            </label>
            <label>
              Audience
              <input value={formState.audience} onChange={(event) => setField("audience", event.target.value)} />
            </label>
            <label>
              Product surface
              <select
                value={formState.productSurface}
                onChange={(event) => setField("productSurface", event.target.value as SkillFormState["productSurface"])}
              >
                <option value="web app">web app</option>
                <option value="marketing site">marketing site</option>
                <option value="dashboard">dashboard</option>
                <option value="mobile web">mobile web</option>
                <option value="other">other</option>
              </select>
            </label>
            {formState.productSurface === "other" ? (
              <label>
                Custom product surface
                <input
                  value={formState.productSurfaceOther}
                  onChange={(event) => setField("productSurfaceOther", event.target.value)}
                  placeholder="desktop app"
                />
              </label>
            ) : null}
          </div>
        )}

        {activeStep.id === "foundations" && (
          <div className="grid">
            <label>
              Visual style keywords
              <input value={formState.visualStyle} onChange={(event) => setField("visualStyle", event.target.value)} />
            </label>
            <label>
              Typography scale (comma or newline separated)
              <textarea
                value={formState.typographyScale}
                onChange={(event) => setField("typographyScale", event.target.value)}
                rows={3}
              />
            </label>
            <label>
              Color palette tokens
              <textarea
                value={formState.colorPalette}
                onChange={(event) => setField("colorPalette", event.target.value)}
                rows={4}
              />
            </label>
            <label>
              Spacing scale tokens
              <textarea
                value={formState.spacingScale}
                onChange={(event) => setField("spacingScale", event.target.value)}
                rows={3}
              />
            </label>
            <label>
              Motion tokens
              <textarea
                value={formState.motionTokens}
                onChange={(event) => setField("motionTokens", event.target.value)}
                rows={3}
              />
            </label>
          </div>
        )}

        {activeStep.id === "components" && (
          <div className="grid">
            <label>
              Component families
              <textarea
                value={formState.componentFamilies}
                onChange={(event) => setField("componentFamilies", event.target.value)}
                rows={4}
              />
            </label>
          </div>
        )}

        {activeStep.id === "accessibility" && (
          <div className="grid">
            <label>
              Accessibility target
              <input
                value={formState.accessibilityTarget}
                onChange={(event) => setField("accessibilityTarget", event.target.value)}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={formState.includeTypeUiNote}
                onChange={(event) => setField("includeTypeUiNote", event.target.checked)}
              />
              Include TypeUI and agentic integration note
            </label>
          </div>
        )}

        {activeStep.id === "rules" && (
          <div className="grid">
            <label>
              Writing tone
              <input value={formState.writingTone} onChange={(event) => setField("writingTone", event.target.value)} />
            </label>
            <label>
              Rules: Do
              <textarea value={formState.rulesDo} onChange={(event) => setField("rulesDo", event.target.value)} rows={5} />
            </label>
            <label>
              Rules: Don&apos;t
              <textarea value={formState.rulesDont} onChange={(event) => setField("rulesDont", event.target.value)} rows={5} />
            </label>
            <label>
              Guideline workflow
              <textarea value={formState.workflow} onChange={(event) => setField("workflow", event.target.value)} rows={6} />
            </label>
            <label>
              Quality gates
              <textarea
                value={formState.qualityGates}
                onChange={(event) => setField("qualityGates", event.target.value)}
                rows={5}
              />
            </label>
          </div>
        )}

        {activeStep.id === "review" && (
          <div className="grid">
            <p className="info">
              This is the final output that you can add to agentic tools. You can check out more curated design systems
              on{" "}
              <a href="https://www.typeui.sh/design-systems" target="_blank" rel="noreferrer">
                typeui.sh
              </a>{" "}
              for examples.
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={copyMarkdown}>
                Copy markdown
              </button>
              <button type="button" className="btn" onClick={() => downloadMarkdown(markdown)}>
                Download .md
              </button>
            </div>
            {copyState === "copied" ? <p className="success">Copied to clipboard.</p> : null}
            {copyState === "failed" ? <p className="error">Copy failed. Use download instead.</p> : null}
            <textarea readOnly value={markdown} rows={22} className="preview" />
          </div>
        )}
      </section>

      <footer className="actions">
        <button type="button" className="btn" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={goNext}>
            Next
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => postToMain({ type: "close-plugin" })}>
            Close Plugin
          </button>
        )}
      </footer>
    </main>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
