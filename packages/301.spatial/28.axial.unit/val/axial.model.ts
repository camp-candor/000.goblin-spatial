export const COORD_OFFSET = 32768; // Lattice domain clamped to [-32768, 32767]

export type PackedAxial = number & { readonly __brand: unique symbol };

export interface AxialCoord {
  readonly q: number;
  readonly r: number;
  readonly s: number; // Planar invariant: q + r + s === 0
}

export interface DoubledCoord {
  readonly x: number; // cx = 4q + 2r
  readonly y: number; // cy = 6r
}

export interface IntVector2D {
  readonly x: bigint;
  readonly y: bigint;
}

export function createAxialCoord(q: number, r: number): AxialCoord {
  if (!Number.isInteger(q) || !Number.isInteger(r)) {
    throw new TypeError(`AXIAL_NON_INTEGER_COORDINATE: (${q}, ${r})`);
  }
  if (q < -COORD_OFFSET || q >= COORD_OFFSET || r < -COORD_OFFSET || r >= COORD_OFFSET) {
    throw new RangeError(`AXIAL_COORDINATE_OUT_OF_BOUNDS: (${q}, ${r})`);
  }
  const s = -q - r;
  return { q, r, s };
}

export function packAxial(q: number, r: number): PackedAxial {
  if (!Number.isInteger(q) || !Number.isInteger(r)) {
    throw new TypeError(`PACK_NON_INTEGER: (${q}, ${r})`);
  }
  if (q < -COORD_OFFSET || q >= COORD_OFFSET || r < -COORD_OFFSET || r >= COORD_OFFSET) {
    throw new RangeError(`PACK_OUT_OF_BOUNDS: (${q}, ${r})`);
  }
  const qOffset = (q + COORD_OFFSET) & 0xFFFF;
  const rOffset = (r + COORD_OFFSET) & 0xFFFF;
  return (((qOffset << 16) | rOffset) >>> 0) as PackedAxial;
}

export function unpackAxial(packed: PackedAxial): AxialCoord {
  const u32 = packed >>> 0;
  const q = ((u32 >>> 16) & 0xFFFF) - COORD_OFFSET;
  const r = (u32 & 0xFFFF) - COORD_OFFSET;
  const s = -q - r;
  return { q, r, s };
}

export function unpackQ(packed: PackedAxial): number {
  return ((packed >>> 16) & 0xFFFF) - COORD_OFFSET;
}

export function unpackR(packed: PackedAxial): number {
  return (packed & 0xFFFF) - COORD_OFFSET;
}
