import { Action } from '../99.core/interface/action.interface'
import LocomotionBit from './fce/locomotion.bit'

// Locomotion actions

export const INIT_LOCOMOTION = '[Locomotion action] Init Locomotion'
export class InitLocomotion implements Action {
    readonly type = INIT_LOCOMOTION
    constructor(public bale: LocomotionBit) {}
}

export const UPDATE_LOCOMOTION = '[Locomotion action] Update Locomotion'
export class UpdateLocomotion implements Action {
    readonly type = UPDATE_LOCOMOTION
    constructor(public bale: LocomotionBit) {}
}

export type Actions = InitLocomotion | UpdateLocomotion
