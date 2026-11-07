import { Action } from '../99.core/interface/action.interface'
import FractionBit from './fce/fraction.bit'

// Fraction actions

export const INIT_FRACTION = '[Fraction action] Init Fraction'
export class InitFraction implements Action {
    readonly type = INIT_FRACTION
    constructor(public bale: FractionBit) {}
}

export const UPDATE_FRACTION = '[Fraction action] Update Fraction'
export class UpdateFraction implements Action {
    readonly type = UPDATE_FRACTION
    constructor(public bale: FractionBit) {}
}

export type Actions = InitFraction | UpdateFraction
