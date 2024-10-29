import * as fs from "fs";
import * as path from "path";
const vscode = require("vscode");

const INSTRUCTION = `This file contains a part of the divided text. Please read it carefully. After reading, you must wait for the next file.`;
const FINAL_INSTRUCTION = `This is the last file. Please provide your final words.`;

/**
 * Checks if the directory is valid.
 * @param dir - The directory to check.
 * @returns True if the directory is valid, otherwise false.
 */
function isValidDirectory(dir: string): boolean {
  const validDirs = [
    "repo-to-text-output",
    "repo-to-text-mini-output",
    "repo-to-text-recovered-output",
  ];
  return validDirs.some((validDir) => dir.includes(validDir));
}

/**
 * Splits a file into smaller parts.
 */
async function splitFile() {
  // Verifica se há um editor ativo
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const inputFilePath = activeEditor.document.uri.fsPath;
  console.log(`Iniciando a divisão do arquivo: ${inputFilePath}`);

  const inputDir = path.dirname(inputFilePath);

  // Check if the directory is valid
  if (!isValidDirectory(inputDir)) {
    console.error(
      `Invalid file. The file must be in one of the folders: repo-to-text-output, repo-to-text-mini-output, repo-to-text-recovered-output.`
    );
    return;
  }

  // Obter o caminho do root do workspace
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const outputDir = path.join(rootPath, "repo-to-text-splitted"); // Criação da pasta principal
  const subDir = path.join(outputDir, path.basename(inputFilePath, path.extname(inputFilePath))); // Subpasta com o nome do arquivo original
  const chunkSize = 1000; // Default size of each part

  // Read the original file
  const fileContent = fs.readFileSync(inputFilePath, "utf-8");

  // Split the file content into smaller parts
  const chunks = [];
  for (let i = 0; i < fileContent.length; i += chunkSize) {
    chunks.push(fileContent.slice(i, i + chunkSize));
  }

  // Create the output directory and subdirectory if they don't exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(subDir, { recursive: true });

  // Create the split files in the new subdirectory
  chunks.forEach((chunk, index) => {
    const chunkFileName = path.join(subDir, `part_${index + 1}.txt`);
    let contentToWrite = "";

    // Add instructions to the first file
    if (index === 0) {
      contentToWrite += INSTRUCTION + "\n\n";
    }

    contentToWrite += chunk;

    // Add instructions to the footer of each file, except the last one
    if (index < chunks.length - 1) {
      contentToWrite += "\n\nPlease wait for the next file.";
    } else {
      contentToWrite += "\n\n" + FINAL_INSTRUCTION;
    }

    // Write the content to the file
    fs.writeFileSync(chunkFileName, contentToWrite, "utf-8");
  });

  console.log(`File split into ${chunks.length} parts and saved in ${subDir}.`);
}

export default splitFile;
