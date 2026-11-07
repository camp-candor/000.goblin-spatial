import { Action } from '../99.core/interface/action.interface'
import EdgeBit from './fce/edge.bit'

// Edge actions

export const INIT_EDGE = '[Edge action] Init Edge'
export class InitEdge implements Action {
    readonly type = INIT_EDGE
    constructor(public bale: EdgeBit) {}
}

export const UPDATE_EDGE = '[Edge action] Update Edge'
export class UpdateEdge implements Action {
    readonly type = UPDATE_EDGE
    constructor(public bale: EdgeBit) {}
}

export type Actions = InitEdge | UpdateEdge
