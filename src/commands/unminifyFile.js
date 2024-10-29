const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const vscode = require('vscode'); // Certifique-se de importar o vscode
const unminifyStrategies = require('../utils/unminifyStrategies');

async function unminifyFile() {
  // Verifica se há um editor ativo
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  console.log(`Iniciando a desminificação do arquivo: ${filePath}`);

  // Verifica se filePath é uma string válida
  if (typeof filePath !== 'string') {
    console.error(`O caminho do arquivo não é uma string válida: ${filePath}`);
    return;
  }

  try {
    // Verifica se o arquivo está na pasta correta e tem a extensão .yaml
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      console.error("Nenhuma pasta de trabalho encontrada.");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const expectedInputDir = path.join(rootPath, 'repo-to-text-mini-output');
    console.log(`Diretório esperado: ${expectedInputDir}`);

    if (!filePath.startsWith(expectedInputDir) || path.extname(filePath) !== '.yaml') {
      console.error(`Arquivo fora do diretório esperado ou não é um arquivo YAML: ${filePath}`);
      return;
    }

    // Carregar o conteúdo do arquivo YAML
    console.log(`Carregando o conteúdo do arquivo YAML: ${filePath}`);
    const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
    console.log(`Conteúdo carregado com sucesso:`, content);

    const unminifiedContent = {};

    // Iterar sobre cada item do YAML
    for (const [key, value] of Object.entries(content)) {
      console.log(`Processando chave: ${key}`);
      const ext = path.extname(key).substring(1); // Identificar a extensão (sem o ponto)

      // Desminificar com a estratégia apropriada se houver uma
      if (unminifyStrategies[ext]) {
        console.log(`Desminificando chave: ${key} com a estratégia: ${ext}`);
        try {
          unminifiedContent[key] = unminifyStrategies[ext](value);
          console.log(`Desminificação concluída para chave: ${key}`);
        } catch (err) {
          console.warn(`Erro ao desminificar o conteúdo de ${key}:`, err.message);
          unminifiedContent[key] = value; // Manter o conteúdo minificado em caso de erro
        }
      } else {
        console.warn(`Extensão não reconhecida para ${key}, mantendo o conteúdo original.`);
        unminifiedContent[key] = value; // Manter o conteúdo original se a extensão não for reconhecida
      }
    }

    // Definir o caminho do arquivo de saída
    const outputDir = path.join(rootPath, 'repo-to-text-recovered-output');
    if (!fs.existsSync(outputDir)) {
      console.log(`Criando diretório de saída: ${outputDir}`);
      fs.mkdirSync(outputDir);
    }

    const outputFilePath = path.join(outputDir, `unminified-${path.basename(filePath)}`);
    console.log(`Salvando YAML desminificado em: ${outputFilePath}`);
    
    // Salvar o YAML desminificado
    fs.writeFileSync(outputFilePath, yaml.dump(unminifiedContent), 'utf8');
    console.log(`Desminificação concluída: ${outputFilePath}`);
  } catch (err) {
    console.error(`Erro ao processar o arquivo YAML:`, err.message);
  }
}

module.exports = unminifyFile;
