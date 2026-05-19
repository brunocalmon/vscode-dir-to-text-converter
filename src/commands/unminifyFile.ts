import * as fs from 'fs';
import yaml from 'js-yaml';
import * as path from 'path';
import * as vscode from 'vscode';
import unminifyStrategies from '../utils/unminifyStrategies';

async function unminifyFile(): Promise<void> {
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
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage("No workspace folder opened.");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const expectedInputDir = path.join(rootPath, 'dir-to-text', 'repo-to-text-mini-output');

    if (!filePath.startsWith(expectedInputDir) || path.extname(filePath) !== '.dttc') {
      vscode.window.showErrorMessage(`File is not in the expected directory or is not a DTTC file: ${filePath}`);
      return;
    }

    console.log(`Loading DTTC file content: ${filePath}`);
    const content = yaml.load(fs.readFileSync(filePath, 'utf8')) as Record<string, string>;
    console.log(`Content loaded successfully:`, content);

    const unminifiedContent: Record<string, string> = {};

    for (const [key, value] of Object.entries(content)) {
      console.log(`Processing key: ${key}`);
      const ext = path.extname(key).substring(1);

      if (unminifyStrategies[ext]) {
        console.log(`Unminifying key: ${key} using strategy: ${ext}`);
        try {
          unminifiedContent[key] = unminifyStrategies[ext](value);
          console.log(`Unminify completed for key: ${key}`);
        } catch (err) {
          console.warn(`Error unminifying content of ${key}:`, (err as Error).message);
          unminifiedContent[key] = value;
        }
      } else {
        console.warn(`Unrecognized extension for ${key}, keeping original content.`);
        unminifiedContent[key] = value;
      }
    }

    const outputDir = path.join(rootPath, 'dir-to-text', 'repo-to-text-recovered-output');
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Fixed: changed .yaml to .dttc in path.basename to avoid unminified-filename.dttc.dttc double extension bug
    const outputFilePath = path.join(outputDir, `unminified-${path.basename(filePath, '.dttc')}.dttc`);
    console.log(`Saving unminified DTTC to: ${outputFilePath}`);

    fs.writeFileSync(outputFilePath, yaml.dump(unminifiedContent), 'utf8');
    console.log(`Unminify completed: ${outputFilePath}`);
    vscode.window.showInformationMessage(`Unminified file saved at ${outputFilePath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Error processing DTTC file: ${(err as Error).message}`);
  }
}

export default unminifyFile;
