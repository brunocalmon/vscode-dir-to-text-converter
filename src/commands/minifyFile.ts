import * as fs from "fs";
import yaml from "js-yaml";
import * as path from "path";
import * as vscode from "vscode";
import minifyStrategies from "../utils/minifyStrategies";

async function minifyFile(): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  console.log(`Starting to minify the file: ${filePath}`);

  if (typeof filePath !== "string") {
    console.error(`Invalid file path: ${filePath}`);
    return;
  }

  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder opened.");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const expectedInputDir = path.join(rootPath, "dir-to-text", "repo-to-text-output");

    if (
      !filePath.startsWith(expectedInputDir) ||
      path.extname(filePath) !== ".dttc"
    ) {
      vscode.window.showErrorMessage(
        `File is not in the expected directory or is not a DTTC file: ${filePath}`
      );
      return;
    }

    const content = yaml.load(fs.readFileSync(filePath, "utf8")) as Record<string, string>;

    const minifiedContent: Record<string, string> = {};

    for (const [key, value] of Object.entries(content)) {
      const ext = path.extname(key).substring(1);
      if (minifyStrategies[ext]) {
        try {
          const result = minifyStrategies[ext](value);
          minifiedContent[key] =
            result instanceof Promise ? await result : result;
        } catch (err) {
          console.warn(`Error minifying content of ${key}:`, (err as Error).message);
          minifiedContent[key] = value;
        }
      } else {
        minifiedContent[key] = value;
      }
    }

    const outputDir = path.join(
      path.dirname(filePath),
      "..",
      "repo-to-text-mini-output"
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fixed: changed .yaml to .dttc in path.basename to avoid minified-filename.dttc.dttc double extension bug
    const outputFilePath = path.join(
      outputDir,
      `minified-${path.basename(filePath, ".dttc")}.dttc`
    );
    fs.writeFileSync(outputFilePath, yaml.dump(minifiedContent), "utf8");
    vscode.window.showInformationMessage(`Minified file saved at ${outputFilePath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Error processing DTTC file: ${(err as Error).message}`);
  }
}

export default minifyFile;
