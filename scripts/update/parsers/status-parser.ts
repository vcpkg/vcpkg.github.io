import { Triplets } from '../types';

const additionalTargets = ['native', 'staticcrt'];

export function allTargets(
  triplets: Triplets,
  defaultValue: boolean = false,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  let group: keyof Triplets;
  for (group in triplets) {
    for (const triplet of triplets[group]) {
      for (const target of triplet.split('-')) {
        result[target] = defaultValue;
      }
    }
  }

  for (const target of additionalTargets) {
    result[target] = defaultValue;
  }

  return result;
}
