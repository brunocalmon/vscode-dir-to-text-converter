import * as vscode from "vscode";
import { Dirent } from "fs";
import * as path from "path";
import * as fs from "fs";
import ignore from "ignore";
import yaml from "js-yaml"; // Importando a biblioteca js-yaml

// Função para gerar um nome de arquivo
function generateFileName(baseName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, ""); // Remove caracteres problemáticos para sistemas de arquivos
  return `${baseName}-${timestamp}.yaml`; // Alterado para salvar em YAML
}

// Função para garantir que o diretório de saída exista
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

// Função para carregar padrões de ignore do .gitignore e configurações do usuário
function loadIgnorePatterns(rootPath: string): string[] {
  const gitignorePath = path.join(rootPath, ".gitignore");
  let patterns: string[] = [];

  // Verifica se o .gitignore existe
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    patterns = gitignoreContent
      .split("\n")
      .filter((line: string) => line && !line.startsWith("#"));
  } else {
    console.log(`No .gitignore file found at ${rootPath}.`);
  }

  // Adiciona padrões de ignore definidos pelo usuário
  const configIgnoredPatterns = vscode.workspace
    .getConfiguration("dir-to-text-converter")
    .get<string[]>("ignoredPatterns");
  if (configIgnoredPatterns) {
    patterns = patterns.concat(configIgnoredPatterns);
  }

  return patterns;
}

// Função para verificar se um caminho deve ser ignorado
function shouldIgnorePath(
  rootPath: string,
  pathToCheck: string,
  ig: ReturnType<typeof ignore>
): boolean {
  console.log("Checking the rootPath:", rootPath);
  console.log("Checking if the path should be ignored:", pathToCheck);

  // Verifica se rootPath é um diretório
  if (!fs.existsSync(rootPath) || !fs.lstatSync(rootPath).isDirectory()) {
    console.error("Invalid rootPath. It must be a valid directory.");
    return false; 
  }

  // Verifica se o caminho relativo é válido antes de verificar os padrões de ignore
  const relativePath = path.relative(rootPath, pathToCheck);
  console.log("Relative Path to ignore:", relativePath);

  if (!relativePath || relativePath.startsWith("..")) {
    console.warn("Invalid relative path, ignoring the check:", relativePath);
    return false; 
  }

  console.log("ShouldIgnore: %s", ig.ignores(relativePath));
  return ig.ignores(relativePath);
}

// Função principal para conversão do repositório
async function repositoryConverter() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No directory opened.");
    return;
  }

  let content: { [key: string]: string } = {};
  const rootPath = workspaceFolders[0].uri.fsPath;

  // Carrega os padrões de ignore
  const patterns = loadIgnorePatterns(rootPath);
  const ig = ignore().add(patterns);

  // Função recursiva para ler diretórios
  function readDirRecursive(dir: string) {
    console.log("Current Directory: ", dir);
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry: Dirent) => {
      const entryPath = path.join(dir, entry.name);
      console.log("Processing Entry:", entryPath);

      // Ignora entradas dentro de .git
      if (entryPath.includes(".git")) {
        console.log("Ignoring Git Directory:", entryPath);
        return;
      }

      // Verifica se o diretório deve ser ignorado
      if (entry.isDirectory()) {
        if (shouldIgnorePath(rootPath, entryPath, ig)) {
          console.log("Ignoring Directory:", entryPath);
          return; // Pula o processamento deste diretório
        }
        console.log("Entry is a Directory");
        readDirRecursive(entryPath);
      } else {
        console.log("Entry is a File [%s]", entryPath);
        console.log("Patterns being used:", patterns);

        // Verifica se o arquivo deve ser ignorado
        if (!shouldIgnorePath(rootPath, entryPath, ig)) {
          console.log("File is not ignored, processing:", entryPath);
          if (fs.existsSync(entryPath)) {
            const relativePath = path.relative(rootPath, entryPath);
            // Adiciona o conteúdo ao objeto usando o diretório como chave
            content[relativePath] = fs.readFileSync(entryPath, "utf-8");
          }
        } else {
          console.log("Ignoring File:", entryPath);
        }
      }
    });
  }

  readDirRecursive(rootPath);
  
  // Escreve o conteúdo em um arquivo YAML
  const yamlContent = yaml.dump(content);
  writeToFile("repo-content", yamlContent);
}

// Função para escrever conteúdo em um arquivo
function writeToFile(baseName: string, content: string) {
  const outputDir = ensureOutputDirectoryExists();
  const fileName = generateFileName(baseName);
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, content, "utf-8");
  vscode.window.showInformationMessage(`File saved at ${filePath}`);
}

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
    [fileName]: fileContent // O nome do arquivo como chave e seu conteúdo como valor
  };

  writeToFile(fileName, yaml.dump(yamlContent)); // Usando js-yaml para converter para YAML
}

// Registro de comandos no VS Code
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
