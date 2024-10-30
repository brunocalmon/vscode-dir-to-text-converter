import * as vscode from "vscode";
import { Dirent } from "fs";
import * as path from "path";
import * as fs from "fs";
import ignore from "ignore";
import yaml from "js-yaml";

// Function to generate a filename with timestamp
function generateFileName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
  return `${baseName}-${timestamp}.dttc`;
}

// Function to ensure the output directory exists
function ensureOutputDirectoryExists(): string {
  const outputDir = path.join(vscode.workspace.rootPath || "", "repo-to-text-output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// Function to load ignore patterns
function loadIgnorePatterns(rootPath: string): string[] {
  const gitignorePath = path.join(rootPath, ".dttcignore");
  let patterns: string[] = [];

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    patterns = gitignoreContent
      .split("\n")
      .filter((line: string) => line && !line.startsWith("#"));
  } else {
    console.log(`No .ddtcignore file found at ${rootPath}.`);
  }

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
  if (!fs.existsSync(rootPath) || !fs.lstatSync(rootPath).isDirectory()) {
    console.error("Invalid rootPath. It must be a valid directory.");
    return false;
  }

  const relativePath = path.relative(rootPath, pathToCheck);

  if (!relativePath || relativePath.startsWith("..")) {
    return false;
  }

  return ig.ignores(relativePath);
}

// Main function to convert the repository
async function repositoryConverter() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    return;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const patterns = loadIgnorePatterns(rootPath);
  const ig = ignore().add(patterns);

  const content: { [key: string]: string } = {};

  function readDirRecursive(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry: Dirent) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (shouldIgnorePath(rootPath, entryPath, ig)) return;
        readDirRecursive(entryPath);
      } else {
        if (!shouldIgnorePath(rootPath, entryPath, ig)) {
          if (fs.existsSync(entryPath)) {
            const relativePath = path.relative(rootPath, entryPath);
            content[relativePath] = fs.readFileSync(entryPath, "utf-8");
          }
        }
      }
    });
  }

  readDirRecursive(rootPath);

  const outputDir = ensureOutputDirectoryExists();
  const fileName = generateFileName("repo-content");
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, yaml.dump(content), "utf-8");
  vscode.window.showInformationMessage(`File saved at ${filePath}`);
}

export default repositoryConverter;