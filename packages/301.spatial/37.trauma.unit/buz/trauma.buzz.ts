export type MobilityClass =
    'STANDARD' | 'ENCUMBERED' | 'LIMPING' | 'IMMOBILIZED'

export interface MobilityProfile {
    readonly mobilityClass: MobilityClass
    readonly costMultiplierBps: number // 10000 = 1.0x
    readonly isTraversable: boolean
}

export function getMobilityProfile(
    mobilityClass: MobilityClass,
): MobilityProfile {
    switch (mobilityClass) {
        case 'STANDARD':
            return {
                mobilityClass,
                costMultiplierBps: 10000,
                isTraversable: true,
            }
        case 'ENCUMBERED':
            return {
                mobilityClass,
                costMultiplierBps: 15000,
                isTraversable: true,
            }
        case 'LIMPING':
            return {
                mobilityClass,
                costMultiplierBps: 20000,
                isTraversable: true,
            }
        case 'IMMOBILIZED':
            return { mobilityClass, costMultiplierBps: 0, isTraversable: false }
        default:
            throw new Error(`UNKNOWN_MOBILITY_CLASS: ${mobilityClass}`)
    }
}

export function scaleTraversalCostByMobility(
    baseCostUnits: number,
    profile: MobilityProfile,
): number {
    if (!profile.isTraversable) {
        return Number.POSITIVE_INFINITY
    }
    return Math.trunc((baseCostUnits * profile.costMultiplierBps) / 10000)
}

export const initTrauma = (cpy: TraumaModel, bal: TraumaBit, ste: State) => {
    debugger
    return cpy
}

export const updateTrauma = (cpy: TraumaModel, bal: TraumaBit, ste: State) => {
    return cpy
}

import { TraumaModel } from '../trauma.model'
import TraumaBit from '../fce/trauma.bit'
import State from '../../99.core/state'
