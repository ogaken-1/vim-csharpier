import { assertEquals } from "https://deno.land/std@0.217.0/assert/assert_equals.ts";
import { reduce } from "./stream.ts";

function createReadableStream<T>(data: T[]): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      data.forEach((item) => controller.enqueue(item));
      controller.close();
    },
  });
}

Deno.test({
  name: "Reduce function should sum numbers in a stream.",
  fn: async () => {
    const numbers = [1, 2, 3, 4, 5];
    const stream = createReadableStream(numbers);
    const reducer = (acc: number, cur: number) => acc + cur;
    const initialValue = 0;

    const result = await reduce(stream, reducer, initialValue);

    assertEquals(result, 15);
  },
});

Deno.test({
  name: "Reduce function should concatanate strings in a stream.",
  fn: async () => {
    const strings = ["a", "b", "cd"];
    const stream = createReadableStream(strings);
    const reducer = (acc: string, cur: string) => acc + cur;
    const initialValue = "";

    const result = await reduce(stream, reducer, initialValue);

    assertEquals(result, "abcd");
  },
});

Deno.test({
  name: "Reduce function should handle an empty stream.",
  fn: async () => {
    const emptyStream = createReadableStream<number>([]);
    const reducer = (acc: number, cur: number) => acc + cur;
    const initialValue = 0;

    const result = await reduce(emptyStream, reducer, initialValue);

    assertEquals(result, 0);
  },
});

Deno.test({
  name: "Reduce function should handle complex objects in a stream.",
  fn: async () => {
    const objects = [{ value: 1 }, { value: 2 }, { value: 3 }];
    const stream = createReadableStream(objects);
    const reducer = (acc: number, cur: { value: number }) => acc + cur.value;
    const initialValue = 0;

    const result = await reduce(stream, reducer, initialValue);

    assertEquals(result, 6);
  },
});
