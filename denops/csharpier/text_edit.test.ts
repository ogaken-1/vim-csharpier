import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { textEdits } from "./text_edit.ts";

Deno.test({
  name: "If no changes, returns empty array",
  fn: () => {
    assertEquals([], textEdits("some text", "some text"));
  },
});
