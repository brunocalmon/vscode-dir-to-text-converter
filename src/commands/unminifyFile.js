const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const vscode = require('vscode');
const unminifyStrategies = require('../utils/unminifyStrategies');

async function unminifyFile() {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showErrorMessage("No file opened.");
    return;
  }

  const filePath = activeEditor.document.uri.fsPath;
  console.log(`Starting to unminify the file: ${filePath}`);

  if (typeof filePath !== 'string') {
    console.error(`Invalid file path: ${filePath}`);
    return;
  }

  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      console.error("No workspace folder found.");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const expectedInputDir = path.join(rootPath, 'repo-to-text-mini-output');

    if (!filePath.startsWith(expectedInputDir) || path.extname(filePath) !== '.dttc') {
      console.error(`File is not in the expected directory or is not a DTTC file: ${filePath}`);
      return;
    }

    console.log(`Loading DTTC file content: ${filePath}`);
    const content = yaml.load(fs.readFileSync(filePath, 'utf8'));
    console.log(`Content loaded successfully:`, content);

    const unminifiedContent = {};

    for (const [key, value] of Object.entries(content)) {
      console.log(`Processing key: ${key}`);
      const ext = path.extname(key).substring(1);

      if (unminifyStrategies[ext]) {
        console.log(`Unminifying key: ${key} using strategy: ${ext}`);
        try {
          unminifiedContent[key] = unminifyStrategies[ext](value);
          console.log(`Unminify completed for key: ${key}`);
        } catch (err) {
          console.warn(`Error unminifying content of ${key}:`, err.message);
          unminifiedContent[key] = value;
        }
      } else {
        console.warn(`Unrecognized extension for ${key}, keeping original content.`);
        unminifiedContent[key] = value;
      }
    }

    const outputDir = path.join(rootPath, 'repo-to-text-recovered-output');
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir);
    }

    const outputFilePath = path.join(outputDir, `unminified-${path.basename(filePath, '.yaml')}.dttc`);
    console.log(`Saving unminified DTTC to: ${outputFilePath}`);

    fs.writeFileSync(outputFilePath, yaml.dump(unminifiedContent), 'utf8');
    console.log(`Unminify completed: ${outputFilePath}`);
  } catch (err) {
    console.error(`Error processing DTTC file:`, err.message);
  }
}

module.exports = unminifyFile;