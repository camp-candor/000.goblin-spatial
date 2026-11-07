import { Action } from '../99.core/interface/action.interface'
import FloorBit from './fce/floor.bit'

// Floor actions

export const INIT_FLOOR = '[Floor action] Init Floor'
export class InitFloor implements Action {
    readonly type = INIT_FLOOR
    constructor(public bale: FloorBit) {}
}

export const UPDATE_FLOOR = '[Floor action] Update Floor'
export class UpdateFloor implements Action {
    readonly type = UPDATE_FLOOR
    constructor(public bale: FloorBit) {}
}

export type Actions = InitFloor | UpdateFloor
