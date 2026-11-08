import { BigIntFraction } from '../fce/segment.interface.js';

export function createFraction(num: bigint, den: bigint): BigIntFraction {
  if (den === 0n) {
    throw new RangeError('FRACTION_ZERO_DENOMINATOR: Denominator cannot be zero');
  }
  if (den < 0n) {
    return { num: -num, den: -den };
  }
  return { num, den };
}

/**
 * Compares two fractions cross-multiplicatively without division:
 * a.num / a.den <=> b.num / b.den === a.num * b.den <=> b.num * a.den
 */
export function compareFractions(a: BigIntFraction, b: BigIntFraction): number {
  const left = a.num * b.den;
  const right = b.num * a.den;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
