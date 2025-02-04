import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { parseVersion } from "./version.ts";

Deno.test("parseVersion should parse x.y.z text", () => {
  assertEquals(
    {
      ok: true,
      major: 1,
      minor: 2,
      patch: 123,
      modifier: undefined,
    },
    parseVersion("1.2.123"),
  );
  assertEquals(
    {
      ok: true,
      major: 1,
      minor: 2,
      patch: 123,
      modifier: "alpha",
    },
    parseVersion("1.2.123-alpha"),
  );
});

Deno.test("parseVersion should return error with invalid text", () => {
  assertEquals(
    { ok: false },
    parseVersion("1.2."),
  );
});
