import { Result } from "./types.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.17.0/mod.ts";

export type Version = {
  major: number;
  minor: number;
  patch: number;
  modifier?: string;
};
const isVersion = is.ObjectOf({
  major: is.String,
  minor: is.String,
  patch: is.String,
  modifier: is.OptionalOf(is.String),
});

export function parseVersion(version: string): Result<Version> {
  const match = version.match(
    /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(-(?<modifier>.+))?$/,
  );
  if (!match) {
    return { ok: false };
  }
  const result = ensure(match.groups, isVersion);
  return {
    ok: true,
    major: Number.parseInt(result.major),
    minor: Number.parseInt(result.minor),
    patch: Number.parseInt(result.patch),
    modifier: result.modifier,
  };
}
