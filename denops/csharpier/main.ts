import { Denops } from "https://deno.land/x/denops_core@v6.0.5/mod.ts";
import { resourceReady, Server } from "./server.ts";
import * as vim from "jsr:@denops/std@8.1.0/function";
import { g } from "jsr:@denops/std@8.1.0/variable";
import { as, assert, ensure, is } from "jsr:@core/unknownutil@4.3.0";
import { applyTextEdits } from "https://deno.land/x/denops_lsputil@v0.9.4/mod.ts";
import { echoerr } from "jsr:@denops/std@8.1.0/helper/echo";

const isContext = is.ObjectOf({
  servers: is.RecordOf(
    as.Optional((x): x is Server => x instanceof Server),
    is.String,
  ),
});

export function main(denops: Denops) {
  denops.context.servers = {};
  denops.dispatcher = {
    startServer: async () => {
      assert(denops.context, isContext);
      const cwd = await vim.getcwd(denops);
      const server = denops.context.servers[cwd];
      if (server != null) {
        return;
      }
      const cmd = ensure(
        await g.get(denops, "csharpier_command"),
        is.UnionOf([is.Null, is.String]),
      ) ?? "dotnet-csharpier";
      if (!await resourceReady(cmd)) {
        return;
      }
      denops.context.servers[cwd] = new Server(cmd, cwd);
    },
    format: async (bufnr: unknown): Promise<void> => {
      assert(denops.context, isContext);
      if (!is.Number(bufnr)) {
        return;
      }
      const cwd = await vim.getcwd(denops);
      const server = denops.context.servers[cwd];
      if (server == null) {
        return;
      }
      const content = await vim.getbufline(denops, bufnr, 1, "$");
      const bufname = await vim.bufname(denops, bufnr);
      const filePath = await vim.fnamemodify(denops, bufname, ":p");
      const result = await server.formatFile(content.join("\n"), filePath);
      if (!result.ok) {
        await echoerr(denops, `CSharpier: ${result.message}`);
        return;
      }
      await applyTextEdits(denops, bufnr, result.textEdits);
    },
  };
}
