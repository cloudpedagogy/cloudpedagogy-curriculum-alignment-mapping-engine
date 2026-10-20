/**
 * Collision-safe ID generator for curriculum entities.
 * Generates stable, collision-free identifiers compatible with existing data model prefixes.
 */
export const generateEntityId = (
  prefix: 'prog' | 'm' | 'lo' | 'a' | 's' | 'rel',
  existingIds?: Iterable<string>
): string => {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  let id = `${prefix}_${timestamp}_${randomSuffix}`;

  if (existingIds) {
    const set = existingIds instanceof Set ? existingIds : new Set(existingIds);
    let counter = 1;
    while (set.has(id)) {
      id = `${prefix}_${timestamp}_${randomSuffix}_${counter++}`;
    }
  }

  return id;
};
