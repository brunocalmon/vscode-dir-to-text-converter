import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml"; // Importando a biblioteca js-yaml

// Função para converter o arquivo atual
async function fileConverter() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  const fileName = path.basename(filePath, path.extname(filePath));
  const fileContent = fs.readFileSync(filePath, "utf-8");

  // Preparar o conteúdo em formato YAML
  const yamlContent = {
    [fileName]: fileContent, // O nome do arquivo como chave e seu conteúdo como valor
  };

  writeToFile(fileName, yaml.dump(yamlContent)); // Usando js-yaml para converter para YAML
}

// Função para escrever conteúdo em um arquivo
function writeToFile(baseName: string, content: string) {
  const outputDir = ensureOutputDirectoryExists("repo-to-text-output");
  const fileName = generateFileName(baseName);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, "utf-8");
  vscode.window.showInformationMessage(`File saved at ${filePath}`);
}

// Função para garantir que o diretório de saída exista
function ensureOutputDirectoryExists(outputDirName: string): string {
  const outputDir = path.join(vscode.workspace.rootPath || "", outputDirName);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// Função para gerar um nome de arquivo
function generateFileName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, ""); // Remove caracteres problemáticos para sistemas de arquivos
  return `${baseName}-${timestamp}.yaml`; // Alterado para salvar em YAML
}

export default fileConverter;
