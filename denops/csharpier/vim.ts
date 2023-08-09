import { Denops } from "https://deno.land/x/denops_core@v5.0.0/mod.ts";

export type AutoCmdBuilderArgs = {
  pattern?: string;
  event: string;
  cmd: string;
  mod?: {
    once?: boolean;
    // buffer?: boolean | number;
    // nested?: boolean;
  };
};

export type AutoCmdGroup = {
  add: (args: AutoCmdBuilderArgs) => Promise<void>;
  clear: () => Promise<void>;
};

function autocmdFunc(denops: Denops, groupName: string) {
  return async (
    args: AutoCmdBuilderArgs,
  ) => {
    await denops.cmd(
      `autocmd ${groupName} ${args.event} ${args.pattern ?? "*"} ${
        (args.mod?.once ?? false) ? "++once" : ""
      } ${args.cmd}`,
    );
  };
}

export async function addAutoCmdGroup(denops: Denops, name: string) {
  await denops.cmd(`augroup ${name}|augroup END`);
  const group: AutoCmdGroup = {
    add: autocmdFunc(denops, name),
    clear: async () => {
      await denops.cmd(`autocmd! ${name}`);
    },
  };
  return group;
}

export type VimCommandBuilderArgs = {
  name: string;
  cmd: string;
};

export type VimCommand = {
  name: string;
  execute: () => Promise<void>;
};

export async function addCommand(denops: Denops, args: VimCommandBuilderArgs) {
  await denops.cmd(`command ${args.name} ${args.cmd}`);
  const command: VimCommand = {
    name: args.name,
    execute: async () => {
      await denops.cmd(args.name);
    },
  };
  return command;
}
