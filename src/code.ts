import { extractStyleGuidelines } from "./extractor";
import { MainToUIMessage, UIToMainMessage } from "./types";

figma.showUI(__html__, {
  width: 980,
  height: 760,
  title: "Figma DESIGN.md Generator - TypeUI",
  themeColors: true
});

let extractionInProgress = false;

function postToUi(message: MainToUIMessage): void {
  figma.ui.postMessage(message);
}

async function runExtraction(): Promise<void> {
  if (extractionInProgress) {
    return;
  }

  extractionInProgress = true;
  postToUi({ type: "extraction-started" });

  try {
    const payload = await extractStyleGuidelines();
    postToUi({ type: "extraction-success", payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    postToUi({ type: "extraction-error", error: message });
  } finally {
    extractionInProgress = false;
  }
}

figma.ui.onmessage = async (message: UIToMainMessage) => {
  switch (message.type) {
    case "resize-ui":
      figma.ui.resize(message.width, message.height);
      break;
    case "extract-guidelines":
      await runExtraction();
      break;
    case "close-plugin":
      figma.closePlugin("Design guideline extractor closed.");
      break;
    default:
      break;
  }
};
