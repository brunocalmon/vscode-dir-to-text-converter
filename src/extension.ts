import * as vscode from "vscode";
import repositoryConverter from "./commands/repositoryConverter";
import fileConverter from "./commands/fileConverter";

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
    )
  );
}

export function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
