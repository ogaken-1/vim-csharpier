import { assert, is } from "jsr:@core/unknownutil@4.3.0";
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

const isResponseBody = is.UnionOf([
  is.ObjectOf({
    formattedFile: is.String,
  }),
  is.ObjectOf({
    formattedFile: is.Nullish,
    status: is.LiteralOf("Failed"),
    errorMessage: is.String,
  }),
]);

const findAvailablePort = (): number => {
  const listener = Deno.listen({ port: 0 });
  const port = listener.addr.port;
  listener.close();
  return port;
};

const decoderStream = new TextDecoderStream();

const isStableVersion = async (cmd: string, cwd: string): Promise<boolean> => {
  const versionRequest = new Deno.Command(cmd, {
    args: ["--version"],
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

export const resourceReady = async (cmd: string): Promise<boolean> => {
  const csharpierOk = async () => {
    try {
      const csharpier = new Deno.Command(cmd, {
        args: ["--version"],
        stdout: "null",
        stderr: "null",
      })
        .spawn();
      await csharpier.output();
      return (await csharpier.status).success;
    } catch {
      return false;
    }
  };
  return await csharpierOk();
};

export class Server implements Disposable {
  #port: number;
  #process: Promise<Deno.ChildProcess>;
  #decoder: TextDecoder;

  constructor(cmd: string, cwd: string) {
    this.#port = findAvailablePort();
    this.#decoder = new TextDecoder();
    this.#process = isStableVersion(cmd, cwd).then((stable) => {
      const args = [
        stable ? "server" : "--server",
        "--server-port",
        this.#port.toString(),
      ];
      return new Deno.Command(cmd, {
        args: args,
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
    const response = await fetch(`http://127.0.0.1:${this.#port}/format`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: `Cannot connect to csharpier server (${response.status}).`,
      };
    }
    const buffer = await response.arrayBuffer();
    const responseBody = JSON.parse(this.#decoder.decode(buffer)) as unknown;
    assert(responseBody, isResponseBody);

    return responseBody.formattedFile != null
      ? {
        ok: true,
        textEdits: textEdits(content, responseBody.formattedFile),
      }
      : {
        ok: false,
        message: responseBody.errorMessage,
      };
  }
}
