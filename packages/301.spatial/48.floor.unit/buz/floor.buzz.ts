import { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js'
import { FloorModel } from '../floor.model.js'
import FloorBit from '../fce/floor.bit.js'
import State from '../../99.core/state.js'

/**
 * Radial priority pruning guard:
 * Traversal terminates immediately when arriving intensity drops at or below ambient floor.
 */
export function shouldPruneAcousticFrontier(
    arrivingIntensityCdb: CentiDecibels,
    ambientNoiseFloorCdb: CentiDecibels,
): boolean {
    return arrivingIntensityCdb <= ambientNoiseFloorCdb
}

/**
 * Dual-condition audibility verification:
 * 1. Arriving intensity exceeds absolute hearing threshold.
 * 2. Arriving intensity exceeds ambient noise floor by minimum SNR margin.
 */
export function verifyAudibilityDualCondition(
    arrivingIntensityCdb: CentiDecibels,
    ambientNoiseFloorCdb: CentiDecibels,
    hearingThresholdCdb: CentiDecibels,
    snrMinCdb: CentiDecibels,
): boolean {
    const clearsThreshold = arrivingIntensityCdb >= hearingThresholdCdb
    const clearsMasking =
        arrivingIntensityCdb - ambientNoiseFloorCdb >= snrMinCdb
    return clearsThreshold && clearsMasking
}

export const initFloor = (cpy: FloorModel, bal: FloorBit, ste: State) => {
    return cpy
}
export const updateFloor = (cpy: FloorModel, bal: FloorBit, ste: State) => {
    return cpy
}
