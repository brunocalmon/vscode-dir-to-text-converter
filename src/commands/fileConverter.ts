import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

async function fileConverter() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const yamlContent = {
    [fileName]: fileContent,
  };

  writeToFile(fileName, yaml.dump(yamlContent));
}

function writeToFile(baseName: string, content: string) {
  const outputDir = ensureOutputDirectoryExists("repo-to-text-output");
  const fileName = generateFileName(baseName);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, "utf-8");
  vscode.window.showInformationMessage(`File saved at ${filePath}`);
}

function ensureOutputDirectoryExists(outputDirName: string): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    throw new Error("No directory opened.");
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  const outputDir = path.join(rootPath || "", "dir-to-text", outputDirName);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true }); // Ensures that all parent directories are created
  }
  return outputDir;
}

function generateFileName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
  return `${baseName}-${timestamp}.dttc`;
}

export default fileConverter;