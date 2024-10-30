import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const INSTRUCTION = "This file contains a part of the divided text. Please read it carefully. After reading, you must wait for the next file.";
const FINAL_INSTRUCTION = "This is the last file. Please provide your final words.";

function isValidDirectory(dir: string): boolean {
  const validDirs = ["repo-to-text-output", "repo-to-text-mini-output", "repo-to-text-recovered-output"];
  return validDirs.some((validDir) => dir.includes(validDir));
}

async function splitFile() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const inputFilePath = activeEditor.document.uri.fsPath;
  console.log(`Starting to split the file: ${inputFilePath}`);

  const inputDir = path.dirname(inputFilePath);

  if (!isValidDirectory(inputDir)) {
    console.error(`Invalid file. The file must be in one of the folders: repo-to-text-output, repo-to-text-mini-output, repo-to-text-recovered-output.`);
    return;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const outputDir = path.join(rootPath, "repo-to-text-splitted");
  const subDir = path.join(outputDir, path.basename(inputFilePath, path.extname(inputFilePath)));
  const chunkSize = 1000;

  const fileContent = fs.readFileSync(inputFilePath, "utf-8");

  const chunks = [];
  for (let i = 0; i < fileContent.length; i += chunkSize) {
    chunks.push(fileContent.slice(i, i + chunkSize));
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(subDir, { recursive: true });

  chunks.forEach((chunk, index) => {
    const chunkFileName = path.join(subDir, `part_${index + 1}.dttc`);
    let contentToWrite = "";

    if (index === 0) {
      contentToWrite += INSTRUCTION + "\n\n";
    }

    contentToWrite += chunk;

    if (index < chunks.length - 1) {
      contentToWrite += "\n\nPlease wait for the next file.";
    } else {
      contentToWrite += "\n\n" + FINAL_INSTRUCTION;
    }

    fs.writeFileSync(chunkFileName, contentToWrite, "utf-8");
  });

  console.log(`File split into ${chunks.length} parts and saved in ${subDir}.`);
}

export default splitFile;