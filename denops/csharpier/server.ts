import { assert, is } from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";
import { LSP } from "https://deno.land/x/denops_lsputil@v0.9.4/deps.ts";
import { textEdits } from "./text_edit.ts";

type Result = { ok: true; textEdits: LSP.TextEdit[] } | { ok: false };

type RequestBody = {
  fileContents: string;
  fileName: string;
};

const isResponseBody = is.ObjectOf({
  formattedFile: is.String,
});

export class Server implements Disposable {
  #port: string;
  #process: Deno.ChildProcess;
  #decoder: TextDecoder;

  constructor(cwd: string) {
    this.#port = "44894";
    this.#decoder = new TextDecoder();
    this.#process = new Deno.Command("dotnet", {
      args: ["csharpier", "--server", "--server-port", this.#port],
      stdin: "null",
      stdout: "piped",
      env: {
        DOTNET_NOLOGO: "1",
      },
      cwd,
    }).spawn();
  }

  [Symbol.dispose](): void {
    this.#process.kill();
  }

  async formatFile(content: string, filePath: string): Promise<Result> {
    const requestBody: RequestBody = {
      fileContents: content,
      fileName: filePath,
    };
    const response = await fetch(`http://localhost:${this.#port}/format`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      return {
        ok: false,
      };
    }
    const responseBody: unknown = await response.arrayBuffer()
      .then((buffer) => JSON.parse(this.#decoder.decode(buffer)));
    assert(responseBody, isResponseBody);
    return {
      ok: true,
      textEdits: textEdits(content, responseBody.formattedFile),
    };
  }
}
