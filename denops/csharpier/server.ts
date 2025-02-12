import { assert, is } from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";
import { LSP } from "https://deno.land/x/denops_lsputil@v0.9.4/deps.ts";
import { textEdits } from "./text_edit.ts";
import { Result } from "./types.ts";
import { parseVersion } from "./version.ts";
import { reduce } from "./stream.ts";

type TextEdits = { textEdits: LSP.TextEdit[] };

type RequestBody = {
  fileContents: string;
  fileName: string;
};

const isResponseBody = is.ObjectOf({
  formattedFile: is.String,
});

const findAvailablePort = (): number => {
  const listener = Deno.listen({ port: 0 });
  const port = listener.addr.port;
  listener.close();
  return port;
};

const decoderStream = new TextDecoderStream();

const isStableVersion = async (cwd: string): Promise<boolean> => {
  const versionRequest = new Deno.Command("dotnet", {
    args: ["csharpier", "--version"],
    stdin: "null",
    stdout: "piped",
    env: {
      DOTNET_NOLOGO: "1",
    },
    cwd,
  }).spawn();
  if (!await versionRequest.status) {
    return false;
  }
  const outputText = await reduce(
    versionRequest.stdout.pipeThrough(decoderStream),
    (accumulator, current) => accumulator + current,
    "",
  );
  const result = parseVersion(outputText.trim());
  return result.ok ? (result.major >= 1) : false;
};

export class Server implements Disposable {
  #port: number;
  #process: Promise<Deno.ChildProcess>;
  #decoder: TextDecoder;

  constructor(cwd: string) {
    this.#port = findAvailablePort();
    this.#decoder = new TextDecoder();
    this.#process = isStableVersion(cwd).then((stable) => {
      const args = [
        stable ? "server" : "--server",
        "--server-port",
        this.#port.toString(),
      ];
      return new Deno.Command("dotnet", {
        args: ["csharpier", ...args],
        stdin: "null",
        stdout: "piped",
        env: {
          DOTNET_NOLOGO: "1",
        },
        cwd,
      }).spawn();
    });
  }

  [Symbol.dispose](): void {
    this.#process.then((p) => p.kill());
  }

  async formatFile(
    content: string,
    filePath: string,
  ): Promise<Result<TextEdits>> {
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
