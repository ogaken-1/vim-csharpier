import { LSP } from "https://deno.land/x/denops_lsputil@v0.9.4/deps.ts";

export function textEdits(from: string, to: string): LSP.TextEdit[] {
  const textEdit: LSP.TextEdit = {
    range: {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: from.length,
        character: from[from.length - 1].length,
      },
    },
    newText: to,
  };
  return [textEdit];
}
