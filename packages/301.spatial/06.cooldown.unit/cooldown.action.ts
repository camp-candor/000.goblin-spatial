import { Action } from '../99.core/interface/action.interface'
import CooldownBit from './fce/cooldown.bit'

// Cooldown actions

export const INIT_COOLDOWN = '[Cooldown action] Init Cooldown'
export class InitCooldown implements Action {
    readonly type = INIT_COOLDOWN
    constructor(public bale: CooldownBit) {}
}

export const UPDATE_COOLDOWN = '[Cooldown action] Update Cooldown'
export class UpdateCooldown implements Action {
    readonly type = UPDATE_COOLDOWN
    constructor(public bale: CooldownBit) {}
}

export type Actions = InitCooldown | UpdateCooldown
