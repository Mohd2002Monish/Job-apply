// Helper to compute diff between two string arrays
export const computeArrayDiff = (oldArr = [], newArr = []) => {
  const oldSet = new Set(oldArr);
  const newSet = new Set(newArr);

  const added = newArr.filter(item => !oldSet.has(item));
  const removed = oldArr.filter(item => !newSet.has(item));
  const unchanged = newArr.filter(item => oldSet.has(item));

  return { added, removed, unchanged, hasChanges: added.length > 0 || removed.length > 0 };
};
