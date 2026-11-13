import { PackedAxial } from '../../28.axial.unit/val/axial.model.js'
import { CentiDecibels } from '../fce/sound.interface.js'

export const MIN_CDB = 0
export const MAX_CDB = 12000 // 120.00 dB
export const AIR_LOSS_PER_HEX_CDB = 150 as CentiDecibels // 1.50 dB per step
export const DEFAULT_SNR_MIN_CDB = 600 as CentiDecibels // 6.00 dB
export const DEFAULT_HEARING_THRESHOLD_CDB = 2000 as CentiDecibels // 20.00 dB
export const REFERENCE_SOURCE_CDB = 8500 as CentiDecibels // 85.00 dB

export function toCentiDecibels(value: number): CentiDecibels {
    if (!Number.isInteger(value)) {
        throw new TypeError(`CDB_NON_INTEGER: ${value}`)
    }
    if (value < MIN_CDB || value > MAX_CDB) {
        throw new RangeError(`CDB_OUT_OF_BOUNDS: ${value} not in [0, 12000]`)
    }
    return value as CentiDecibels
}

export function clampCentiDecibels(value: number): CentiDecibels {
    if (!Number.isInteger(value)) {
        throw new TypeError(`CLAMP_CDB_NON_INTEGER: ${value}`)
    }
    if (value < MIN_CDB) return MIN_CDB as CentiDecibels
    if (value > MAX_CDB) return MAX_CDB as CentiDecibels
    return value as CentiDecibels
}

/**
 * Undirected edge canonical string key to ensure symmetric partition damping.
 */
export function canonicalUndirectedEdgeKey(
    p1: PackedAxial,
    p2: PackedAxial,
): string {
    return p1 < p2 ? `${p1}:${p2}` : `${p2}:${p1}`
}
