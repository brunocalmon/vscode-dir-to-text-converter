import * as vscode from "vscode";
import { Dirent } from "fs";
import * as path from "path";
import * as fs from "fs";
import ignore from "ignore";

// Function to generate a file name
function generateFileName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, ""); // Remove problematic characters for file systems
  return `${baseName}-${timestamp}.txt`;
}

// Function to ensure that the output directory exists
function ensureOutputDirectoryExists(): string {
  const outputDir = path.join(
    vscode.workspace.rootPath || "",
    "repo-to-text-output"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// Function to load ignore patterns from .gitignore and user settings
function loadIgnorePatterns(rootPath: string): string[] {
  const gitignorePath = path.join(rootPath, ".gitignore");
  let patterns: string[] = [];

  // Check if .gitignore exists
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    patterns = gitignoreContent
      .split("\n")
      .filter((line: string) => line && !line.startsWith("#"));
  } else {
    console.log(`No .gitignore file found at ${rootPath}.`);
  }

  // Add user-defined ignore patterns
  const configIgnoredPatterns = vscode.workspace
    .getConfiguration("dir-to-text-converter")
    .get<string[]>("ignoredPatterns");
  if (configIgnoredPatterns) {
    patterns = patterns.concat(configIgnoredPatterns);
  }

  return patterns;
}

// Function to check if a path should be ignored
function shouldIgnorePath(
  rootPath: string,
  pathToCheck: string,
  ig: ReturnType<typeof ignore>
): boolean {
  // Log the path being checked
  console.log("Checking the rootPath:", rootPath);
  console.log("Checking if the path should be ignored:", pathToCheck);

  // Ensure rootPath is a directory
  if (!fs.existsSync(rootPath) || !fs.lstatSync(rootPath).isDirectory()) {
    throw new Error("Invalid rootPath. It must be a valid directory."); // Lança um erro se o rootPath for inválido
  }

  // Ensure the path is relative for the ignore patterns
  const relativePath = path.relative(rootPath, pathToCheck);
  console.log("Relative Path to ignore:", relativePath);

  // Check if the relative path is valid before checking ignore patterns
  if (!relativePath || relativePath.startsWith("..")) {
    throw new Error(
      `Invalid relative path: ${relativePath}. Path is not within the root directory.`
    ); // Lança um erro se o relativePath for inválido
  }

  console.log("ShouldIgnore: %s", ig.ignores(relativePath));
  return ig.ignores(relativePath);
}

// Main repository conversion function
async function repositoryConverter() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    return;
  }

  let content = "";
  const rootPath = workspaceFolders[0].uri.fsPath;
  const repoName = path.basename(rootPath);

  // Load ignore patterns
  const patterns = loadIgnorePatterns(rootPath);
  const ig = ignore().add(patterns);

  // Recursive directory reading function
  function readDirRecursive(dir: string) {
    console.log("Current Directory: ", dir);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry: Dirent) => {
      const entryPath = path.join(dir, entry.name);

      console.log("Processing Entry:", entryPath);

      // Ignore entries inside .git
      if (entryPath.includes(".git")) {
        console.log("Ignoring Git Directory:", entryPath);
        return;
      }

      // Check if the directory should be ignored
      if (entry.isDirectory()) {
        if (shouldIgnorePath(rootPath, entryPath, ig)) {
          console.log("Ignoring Directory:", entryPath);
          return; // Skip processing this directory
        }
        console.log("Entry is a Directory");
        readDirRecursive(entryPath);
      } else {
        console.log("Entry is a File [%s]", entryPath);
        console.log("Patterns being used:", patterns);

        // Check if the file should be ignored
        if (!shouldIgnorePath(rootPath, entryPath, ig)) {
          console.log("File is not ignored, processing:", entryPath);
          if (fs.existsSync(entryPath)) {
            const relativePath = path.relative(rootPath, entryPath);
            content += `./${relativePath}\n\`\`\`\n${fs.readFileSync(
              entryPath,
              "utf-8"
            )}\n\`\`\`\n\n`;
          }
        } else {
          console.log("Ignoring File:", entryPath);
        }
      }
    });
  }

  readDirRecursive(rootPath);
  writeToFile(repoName, content);
}

// Function to write content to a file
function writeToFile(baseName: string, content: string) {
  const outputDir = ensureOutputDirectoryExists();
  const fileName = generateFileName(baseName);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, "utf-8");
  vscode.window.showInformationMessage(`File saved at ${filePath}`);
}

// Function to convert the current file
async function fileConverter() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  const fileName = path.basename(filePath, path.extname(filePath));
  const content = `./${fileName}\n\`\`\`\n${fs.readFileSync(
    filePath,
    "utf-8"
  )}\n\`\`\`\n\n`;

  writeToFile(fileName, content);
}

// Register commands in VS Code
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "dir-to-text-converter.repositoryConverter",
      repositoryConverter
    ),
    vscode.commands.registerCommand(
      "dir-to-text-converter.fileConverter",
      fileConverter
    )
  );
}

export function deactivate() {}
