function readRunOptions(search = globalThis.location?.search ?? "") {
  const params = new URLSearchParams(search);
  return {
    seed: params.get("seed"),
    runLabel: params.get("run"),
  };
}

export { readRunOptions };
