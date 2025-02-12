export async function reduce<StreamContent, Result>(
  stream: ReadableStream<StreamContent>,
  reducer: (accumulator: Result, current: StreamContent) => Result,
  initialValue: Result,
) {
  const reader = stream.getReader();
  let accumulator = initialValue;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        accumulator = reducer(accumulator, value);
      }
    }
  } finally {
    reader.releaseLock();
  }
  return accumulator;
}
