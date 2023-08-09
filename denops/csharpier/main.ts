import { Denops } from "https://deno.land/x/denops_core@v5.0.0/mod.ts";
import { CsharpierProcess } from "./CsharpierProcess.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import { addAutoCmdGroup, addCommand } from "./vim.ts";
import { echoerr } from "https://deno.land/x/denops_std@v5.0.1/helper/echo.ts";
import { applyTextEdits } from "https://deno.land/x/denops_lsputil@v0.5.4/mod.ts";
import { is } from "https://deno.land/x/unknownutil@v3.4.0/mod.ts";

type Context = {
  CsharpierProcess?: CsharpierProcess;
};

function ensureContext(denops: Denops) {
  let context = denops.context[denops.name] as Context | undefined;
  if (context == null) {
    context = {};
    denops.context[denops.name] = context;
  }
  return context;
}

/**
 * Spawn a csharpier process on current window's cwd.
 */
async function spawn(denops: Denops) {
  const context = ensureContext(denops);
  context.CsharpierProcess ??= new CsharpierProcess({
    cwd: await fn.getcwd(denops, await fn.winnr(denops)),
    onExit: async (status) => {
      if (!status.success) {
        await echoerr(
          denops,
          `Csharpier process exited with status code: ${status.code}`,
        );
      }
    },
  });
}

export async function main(denops: Denops) {
  denops.dispatcher = {
    ...denops.dispatcher,
    spawn: async () => {
      await spawn(denops);
    },
    format: async (bufnr: unknown) => {
      if (!is.Number(bufnr)) {
        return;
      }

      const context = ensureContext(denops);
      if (context.CsharpierProcess == null) {
        return;
      }

      const fname = await fn.bufname(denops, bufnr);
      const content = (await fn.getbufline(denops, bufnr, 1)).join("\n");

      await applyTextEdits(denops, bufnr, [
        await context.CsharpierProcess.format(fname, content),
      ]);
    },
  };

  const autoCommands = await addAutoCmdGroup(denops, "Csharpier");

  await autoCommands.add({
    event: "FileType",
    pattern: "cs",
    cmd: `call denops#notify('${denops.name}', 'spawn', [])`,
    mod: {
      once: true,
    },
  });

  const cmd = await addCommand(denops, {
    name: "Csharpier",
    cmd: `call denops#request('${denops.name}', 'format', [])`,
  });

  await autoCommands.add({
    event: "BufWritePre",
    pattern: "*.cs",
    cmd: cmd.name,
  });
}
