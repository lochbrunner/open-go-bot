export function make2d<T>(input: T[], edgeLength: number): T[][] {
  const output: T[][] = [];
  const t = input;
  while (t.length) output.push(t.splice(0, edgeLength));
  return output;
}