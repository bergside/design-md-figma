import { UIToMainMessage } from "./types";

figma.showUI(__html__, {
  width: 520,
  height: 760,
  title: "Figma Skill Generator",
  themeColors: true
});

figma.ui.onmessage = (message: UIToMainMessage) => {
  switch (message.type) {
    case "resize-ui":
      figma.ui.resize(message.width, message.height);
      break;
    case "close-plugin":
      figma.closePlugin("Skill generator closed.");
      break;
    default:
      break;
  }
};
