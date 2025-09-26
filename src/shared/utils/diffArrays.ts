export const diffArrays = (a: number[], b: number[]) => {
  const count = (arr: number[]) =>
    arr.reduce<Record<number, number>>(
      (map, num) => ({
        ...map,
        [num]: (map[num] || 0) + 1,
      }),
      {},
    );

  const aCount = count(a);
  const bCount = count(b);

  const added: number[] = [];
  const removed: number[] = [];

  const allKeys = new Set([...Object.keys(aCount), ...Object.keys(bCount)]);

  allKeys.forEach((key) => {
    const num = Number(key);
    const diff = (bCount[num] || 0) - (aCount[num] || 0);

    if (diff > 0) {
      added.push(...Array(diff).fill(num));
    } else if (diff < 0) {
      removed.push(...Array(-diff).fill(num));
    }
  });

  return { added, removed };
};
