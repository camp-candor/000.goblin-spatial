import { Action } from '../99.core/interface/action.interface'
import CapacityBit from './fce/capacity.bit'

// Capacity actions

export const INIT_CAPACITY = '[Capacity action] Init Capacity'
export class InitCapacity implements Action {
    readonly type = INIT_CAPACITY
    constructor(public bale: CapacityBit) {}
}

export const UPDATE_CAPACITY = '[Capacity action] Update Capacity'
export class UpdateCapacity implements Action {
    readonly type = UPDATE_CAPACITY
    constructor(public bale: CapacityBit) {}
}

export type Actions = InitCapacity | UpdateCapacity
