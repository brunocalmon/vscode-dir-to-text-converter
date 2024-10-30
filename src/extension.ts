import * as vscode from "vscode";
import repositoryConverter from "./commands/repositoryConverter";
import fileConverter from "./commands/fileConverter";
import splitFile from './commands/splitFile';
import { readDttcCommand } from './commands/readDttcCommand';

const minifyFile = require("./commands/minifyFile");
const unminifyFile = require("./commands/unminifyFile");

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
    ),
    vscode.commands.registerCommand(
      "dir-to-text-converter.minifyFile",
      minifyFile
    ),
    vscode.commands.registerCommand(
      "dir-to-text-converter.unminifyFile",
      unminifyFile
    ),
    vscode.commands.registerCommand(
      "dir-to-text-converter.splitFile",
      splitFile 
    ),
    vscode.commands.registerCommand('dir-to-text-converter.readDttc', readDttcCommand)
  );
}

export function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
