import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DeterministicFallbackContext } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Stable hash-based metric fallback for view-only values when DB fields are missing.
export function deterministicMetric({ entityId, min = 0, max = 100 }: DeterministicFallbackContext): number {
  let hash = 0;
  for (let i = 0; i < entityId.length; i += 1) {
    hash = ((hash << 5) - hash + entityId.charCodeAt(i)) | 0;
  }
  const span = Math.max(1, max - min);
  return min + (Math.abs(hash) % (span + 1));
}

export function resolveMetric(fieldValue: number | undefined | null, ctx: DeterministicFallbackContext): number {
  if (typeof fieldValue === 'number' && Number.isFinite(fieldValue)) {
    return fieldValue;
  }
  return deterministicMetric(ctx);
}
