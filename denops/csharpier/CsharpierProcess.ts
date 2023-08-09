import { LSP } from "https://deno.land/x/denops_lsputil@v0.5.4/deps.ts";

const endOfText = "\u0003";

export class CsharpierProcess {
  constructor(
    args: {
      cwd: string;
      onExit: (status: Deno.CommandStatus) => Promise<void>;
      errorStream?: WritableStream<Uint8Array>;
    },
  ) {
    this.#process = new Deno.Command("dotnet", {
      args: ["csharpier", "--pipe-multiple-files"],
      cwd: args.cwd,
      stdout: "piped",
      stdin: "piped",
      stderr: args.errorStream != null ? "piped" : "null",
      env: {
        DOTNET_NOLOGO: "1",
      },
    }).spawn();
    this.#process.status.then(args.onExit);
    if (args.errorStream != null) {
      this.#process.stderr.pipeTo(args.errorStream);
    }
  }

  #process: Deno.ChildProcess;

  format(path: string, content: string): Promise<LSP.TextEdit> {
    const writer = this.#process.stdin.getWriter();
    const encoder = new TextEncoder();
    writer.ready.then(() => {
      try {
        writer.write(
          encoder.encode(
            [path, endOfText, content, endOfText].join(),
          ),
        );
      } finally {
        writer.releaseLock();
      }
    });
    throw new Deno.errors.NotSupported();
  }
}
