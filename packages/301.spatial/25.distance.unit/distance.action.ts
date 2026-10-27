import { Action } from '../99.core/interface/action.interface'
import DistanceBit from './fce/distance.bit'

// Distance actions

export const INIT_DISTANCE = '[Distance action] Init Distance'
export class InitDistance implements Action {
    readonly type = INIT_DISTANCE
    constructor(public bale: DistanceBit) {}
}

export const UPDATE_DISTANCE = '[Distance action] Update Distance'
export class UpdateDistance implements Action {
    readonly type = UPDATE_DISTANCE
    constructor(public bale: DistanceBit) {}
}

export type Actions = InitDistance | UpdateDistance
