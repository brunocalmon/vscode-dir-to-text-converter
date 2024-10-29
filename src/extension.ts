import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('dir-to-text-converter.repositoryConverter', repositoryConverter)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dir-to-text-converter.dirConverter', dirConverter)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('dir-to-text-converter.fileConverter', fileConverter)
  );
}

async function repositoryConverter() {
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!rootPath) {
    vscode.window.showErrorMessage("Nenhum repositório aberto.");
    return;
  }

  const outputFilePath = path.join(rootPath, "repository-contents.txt");
  const content = await getDirectoryContent(rootPath);
  await writeToFile(outputFilePath, content);
}

async function dirConverter() {
  const currentDir = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!currentDir) {
    vscode.window.showErrorMessage("Nenhum diretório atual encontrado.");
    return;
  }

  const dirPath = path.dirname(currentDir);
  const outputFilePath = path.join(dirPath, "directory-contents.txt");
  const content = await getDirectoryContent(dirPath);
  await writeToFile(outputFilePath, content);
}

async function fileConverter() {
  const currentFile = vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!currentFile) {
    vscode.window.showErrorMessage("Nenhum arquivo aberto.");
    return;
  }

  const content = await getFileContent(currentFile);
  const outputFilePath = path.join(path.dirname(currentFile), "file-contents.txt");
  await writeToFile(outputFilePath, content);
}

async function getDirectoryContent(dirPath: string): Promise<string> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  let content = "";

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isFile()) {
      content += await getFileContent(fullPath);
    } else if (entry.isDirectory()) {
      content += await getDirectoryContent(fullPath);
    }
  }

  return content;
}

async function getFileContent(filePath: string): Promise<string> {
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  return `./${path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', filePath)}\n\`\`\`\n${fileContent}\n\`\`\`\n\n`;
}

async function writeToFile(filePath: string, content: string) {
  await fs.promises.writeFile(filePath, content, 'utf-8');
  vscode.window.showInformationMessage(`Conteúdo salvo em ${filePath}`);
}

export function deactivate() {}
