import { Action } from '../99.core/interface/action.interface'
import SoundBit from './fce/sound.bit'

// Sound actions

export const INIT_SOUND = '[Sound action] Init Sound'
export class InitSound implements Action {
    readonly type = INIT_SOUND
    constructor(public bale: SoundBit) {}
}

export const UPDATE_SOUND = '[Sound action] Update Sound'
export class UpdateSound implements Action {
    readonly type = UPDATE_SOUND
    constructor(public bale: SoundBit) {}
}

export type Actions = InitSound | UpdateSound
