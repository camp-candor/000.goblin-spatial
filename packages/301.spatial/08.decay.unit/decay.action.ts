import { Action } from '../99.core/interface/action.interface'
import DecayBit from './fce/decay.bit'

// Decay actions

export const INIT_DECAY = '[Decay action] Init Decay'
export class InitDecay implements Action {
    readonly type = INIT_DECAY
    constructor(public bale: DecayBit) {}
}

export const UPDATE_DECAY = '[Decay action] Update Decay'
export class UpdateDecay implements Action {
    readonly type = UPDATE_DECAY
    constructor(public bale: DecayBit) {}
}

export type Actions = InitDecay | UpdateDecay
