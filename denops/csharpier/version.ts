import { Result } from "./types.ts";
import { as, ensure, is } from "jsr:@core/unknownutil@4.3.0";

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
  modifier: as.Optional(is.String),
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
