export function make2d<T>(input: T[], edgeLength: number): T[][] {
  const output: T[][] = [];
  const t = input;
  while (t.length) output.push(t.splice(0, edgeLength));
  return output;
}

export function argMax(array: number[]) {
  let max = Number.MIN_VALUE;
  let maxIndex = -1;
  for (let i = 0; i < array.length; ++i) {
    if (array[i] > max) {
      maxIndex = i;
      max = array[i];
    }
  }
  return maxIndex;
}