const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const vscode = require('vscode'); // Certifique-se de importar o vscode
const minifyStrategies = require("../utils/minifyStrategies");

async function minifyFile() {
  // Verifica se há um editor ativo
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  console.log(`Iniciando a minificação do arquivo: ${filePath}`);

  // Verifica se filePath é uma string válida
  if (typeof filePath !== 'string') {
    console.error(`O caminho do arquivo não é uma string válida: ${filePath}`);
    return;
  }

  try {
    // Verifica se há pastas de trabalho abertas
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder opened.");
      return;
    }

    // Obtém o caminho da primeira pasta de trabalho
    const rootPath = workspaceFolders[0].uri.fsPath;
    const expectedInputDir = path.join(rootPath, 'repo-to-text-output');
    console.log(`Diretório esperado: ${expectedInputDir}`);

    // Verifica se o arquivo está na pasta correta e tem a extensão .yaml
    if (!filePath.startsWith(expectedInputDir) || path.extname(filePath) !== '.yaml') {
      console.error(`Arquivo fora do diretório esperado ou não é um arquivo YAML: ${filePath}`);
      return;
    }

    // Carregar o conteúdo do arquivo YAML
    console.log(`Carregando o conteúdo do arquivo YAML: ${filePath}`);
    const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
    console.log(`Conteúdo carregado com sucesso:`, content);

    const minifiedContent = {};

    // Iterar sobre cada item do YAML
    for (const [key, value] of Object.entries(content)) {
      console.log(`Processando chave: ${key}`);
      const ext = path.extname(key).substring(1); // Identificar a extensão (sem o ponto)

      // Minificar com a estratégia apropriada se houver uma
      if (minifyStrategies[ext]) {
        console.log(`Minificando chave: ${key} com a estratégia: ${ext}`);
        try {
          const result = minifyStrategies[ext](value);
          // Verifica se o resultado é uma Promise e aguarda
          minifiedContent[key] = result instanceof Promise ? await result : result;
          console.log(`Minificação concluída para chave: ${key}`);
        } catch (err) {
          console.warn(`Erro ao minificar o conteúdo de ${key}:`, err.message);
          minifiedContent[key] = value; // Manter o conteúdo original em caso de erro
        }
      } else {
        console.warn(`Extensão não reconhecida para chave: ${key}. Mantendo o conteúdo original.`);
        minifiedContent[key] = value;
      }
    }

    // Definir o caminho do arquivo de saída
    const outputDir = path.join(path.dirname(filePath), '..', 'repo-to-text-mini-output');
    if (!fs.existsSync(outputDir)) {
      console.log(`Criando diretório de saída: ${outputDir}`);
      fs.mkdirSync(outputDir);
    }

    const outputFilePath = path.join(outputDir, `minified-${path.basename(filePath)}`);
    console.log(`Salvando YAML minificado em: ${outputFilePath}`);
    
    // Salvar o YAML minificado
    fs.writeFileSync(outputFilePath, yaml.dump(minifiedContent), 'utf8');
    console.log(`Minificação concluída: ${outputFilePath}`);
  } catch (err) {
    console.error(`Erro ao processar o arquivo YAML:`, err.message);
  }
}

module.exports = minifyFile;
