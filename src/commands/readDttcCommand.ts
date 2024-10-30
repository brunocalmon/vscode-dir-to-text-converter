// src/commands/readDttcCommand.ts
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import * as vscode from "vscode";

export async function readDttcCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Nenhum arquivo está aberto.");
    return;
  }

  const document = editor.document;
  if (path.extname(document.fileName) !== ".dttc") {
    vscode.window.showErrorMessage(
      "O arquivo aberto não é um arquivo .dttc válido."
    );
    return;
  }

  try {
    const content = document.getText();
    const parsedContent = yaml.load(content) as Record<string, any>;

    for (const [key, value] of Object.entries(parsedContent)) {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No directory opened.");
        throw new Error("No directory opened.");
      }

      const rootPath = workspaceFolders[0].uri.fsPath;

      const filePath = path.join(rootPath || "", key);
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, value, "utf8");
      } else {
        vscode.window.showWarningMessage(
          `O arquivo ${key} não existe no repositório.`
        );
      }
    }
    vscode.window.showInformationMessage("Arquivos atualizados com sucesso!");
  } catch (error) {
    vscode.window.showErrorMessage(
      "Erro ao ler o arquivo .dttc: " + (error as Error).message
    );
  }
}
