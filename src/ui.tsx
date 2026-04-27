import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { generateDesignMarkdown, generateSkillMarkdown } from "./generator";
import { ExtractedStyleGuidelines, MainToUIMessage, UIToMainMessage } from "./types";

type ExtractionStatus = "idle" | "loading" | "success" | "error";
type CopyState = "idle" | "copied" | "failed";
type DocKind = "design" | "skill";
const PLUGIN_VERSION = "v1.0.0";
const GITHUB_REPO_URL = "https://github.com/bergside/design-md-figma";
const TYPEUI_DESIGN_SKILLS_URL = "https://www.typeui.sh/design-skills";

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

async function copyMarkdown(markdown: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(markdown);
    return true;
  }

  return fallbackCopy(markdown);
}

function downloadMarkdown(markdown: string, fileName: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString();
}

function App() {
  const [status, setStatus] = useState<ExtractionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<ExtractedStyleGuidelines | null>(null);

  const [generatedDesignMarkdown, setGeneratedDesignMarkdown] = useState<string>("");
  const [generatedSkillMarkdown, setGeneratedSkillMarkdown] = useState<string>("");

  const [designMarkdown, setDesignMarkdown] = useState<string>("");
  const [skillMarkdown, setSkillMarkdown] = useState<string>("");
  const [activeDoc, setActiveDoc] = useState<DocKind>("design");

  const [designCopyState, setDesignCopyState] = useState<CopyState>("idle");
  const [skillCopyState, setSkillCopyState] = useState<CopyState>("idle");

  const runExtraction = () => {
    setError(null);
    postToMain({ type: "extract-guidelines" });
  };

  useEffect(() => {
    postToMain({ type: "resize-ui", width: 980, height: 760 });

    const onMessage = (event: MessageEvent<{ pluginMessage?: MainToUIMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) {
        return;
      }

      switch (message.type) {
        case "extraction-started":
          setStatus("loading");
          setError(null);
          break;
        case "extraction-success": {
          setStatus("success");
          setError(null);

          const nextGuidelines = message.payload.styleGuidelines;
          const nextSkillState = message.payload.formState;
          const nextDesignMarkdown = generateDesignMarkdown(nextGuidelines);
          const nextSkillMarkdown = generateSkillMarkdown(nextSkillState);

          setGuidelines(nextGuidelines);
          setGeneratedDesignMarkdown(nextDesignMarkdown);
          setGeneratedSkillMarkdown(nextSkillMarkdown);
          setDesignMarkdown(nextDesignMarkdown);
          setSkillMarkdown(nextSkillMarkdown);
          setDesignCopyState("idle");
          setSkillCopyState("idle");
          break;
        }
        case "extraction-error":
          setStatus("error");
          setError(message.error || "Failed to extract style guidelines.");
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", onMessage);
    runExtraction();

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  const statusText = useMemo<string | null>(() => {
    if (status === "loading") {
      return "Extracting local styles, variables, and components...";
    }

    if (status === "success") {
      return null;
    }

    if (status === "error") {
      return "Extraction failed. Fix the issue and run extraction again.";
    }

    return null;
  }, [status]);

  const designDirty = generatedDesignMarkdown.length > 0 && designMarkdown !== generatedDesignMarkdown;
  const skillDirty = generatedSkillMarkdown.length > 0 && skillMarkdown !== generatedSkillMarkdown;

  const copyDesign = async () => {
    try {
      const copied = await copyMarkdown(designMarkdown);
      setDesignCopyState(copied ? "copied" : "failed");
    } catch (_error) {
      setDesignCopyState("failed");
    }

    window.setTimeout(() => setDesignCopyState("idle"), 1800);
  };

  const copySkill = async () => {
    try {
      const copied = await copyMarkdown(skillMarkdown);
      setSkillCopyState(copied ? "copied" : "failed");
    } catch (_error) {
      setSkillCopyState("failed");
    }

    window.setTimeout(() => setSkillCopyState("idle"), 1800);
  };

  const activeFileName = activeDoc === "design" ? "DESIGN.md" : "SKILL.md";
  const activeMarkdown = activeDoc === "design" ? designMarkdown : skillMarkdown;
  const activeDirty = activeDoc === "design" ? designDirty : skillDirty;
  const activeCopyState = activeDoc === "design" ? designCopyState : skillCopyState;

  const copyActive = async () => {
    if (activeDoc === "design") {
      await copyDesign();
      return;
    }

    await copySkill();
  };

  const updateActive = (value: string) => {
    if (activeDoc === "design") {
      setDesignMarkdown(value);
      return;
    }

    setSkillMarkdown(value);
  };

  return (
    <main className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>Figma DESIGN.md Generator - TypeUI</h1>
            <p>
              Automatically extracts local Figma style guidelines and creates editable <code>DESIGN.md</code> and <code>SKILL.md</code> drafts. Based on <a href="https://typeui.sh" target="_blank" rel="noopener noreferrer">TypeUI</a> configuration.
            </p>
          </div>
          <a
            className="repo-link"
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`GitHub repository ${PLUGIN_VERSION}`}
            title="Open GitHub repository"
          >
            <svg className="repo-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.2-.02-2.17-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.27 1.19-3.07-.12-.29-.52-1.45.11-3.02 0 0 .97-.31 3.17 1.17a10.94 10.94 0 0 1 5.78 0c2.2-1.48 3.17-1.17 3.17-1.17.63 1.57.23 2.73.11 3.02.74.8 1.19 1.82 1.19 3.07 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.04.78 2.1 0 1.52-.01 2.74-.01 3.11 0 .31.21.67.8.55A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
              />
            </svg>
            <span>{PLUGIN_VERSION}</span>
          </a>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {guidelines ? (
        <section className="summary">
          <p className="summary-line">
            <strong>Source:</strong> {guidelines.fileName} / {guidelines.pageName}
          </p>
          <p className="summary-line">
            <strong>Extracted:</strong> {formatDate(guidelines.extractedAt)}
          </p>
          <p className="summary-line">
            <strong>Counts:</strong> {guidelines.colorTokens.length} colors, {guidelines.typographyTokens.length} text styles, {guidelines.spacingTokens.length} spacing tokens, {guidelines.componentFamilies.length} component families
          </p>
        </section>
      ) : null}

      <section className="doc-toggle" role="tablist" aria-label="Generated markdown files">
        <button
          type="button"
          role="tab"
          aria-selected={activeDoc === "design"}
          className={`toggle-btn ${activeDoc === "design" ? "toggle-btn-active" : ""}`}
          onClick={() => setActiveDoc("design")}
        >
          DESIGN.md
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeDoc === "skill"}
          className={`toggle-btn ${activeDoc === "skill" ? "toggle-btn-active" : ""}`}
          onClick={() => setActiveDoc("skill")}
        >
          SKILL.md
        </button>
      </section>

      <section className="docs-grid">
        <article className="doc-panel">
          <div className="doc-header">
            <h2>{activeFileName}</h2>
            <div className="row">
              <button type="button" className="btn" onClick={copyActive} disabled={!activeMarkdown}>
                Copy
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => downloadMarkdown(activeMarkdown, activeFileName)}
                disabled={!activeMarkdown}
              >
                Download
              </button>
              <button
                type="button"
                className="btn"
                onClick={runExtraction}
                disabled={status === "loading"}
                aria-label={status === "loading" ? "Extraction in progress" : "Refresh"}
                title={status === "loading" ? "Extracting..." : "Refresh"}
              >
                Refresh
              </button>
            </div>
          </div>
          <p className="muted">{activeDirty ? "Edited" : "Generated"}</p>
          {activeCopyState === "copied" ? <p className="success">Copied to clipboard.</p> : null}
          {activeCopyState === "failed" ? <p className="error">Copy failed. Use download instead.</p> : null}
          <textarea
            className="preview"
            value={activeMarkdown}
            onChange={(event) => updateActive(event.target.value)}
            spellCheck={false}
          />
        </article>
      </section>

      <footer className="actions">
        <p className="footer-note">
          Find more curated design skills at{" "}
          <a href={TYPEUI_DESIGN_SKILLS_URL} target="_blank" rel="noopener noreferrer">
            TypeUI
          </a>{" "}
          and improve UI generation with AI.
        </p>
        <button type="button" className="btn" onClick={() => postToMain({ type: "close-plugin" })}>
          Close Plugin
        </button>
      </footer>
    </main>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
