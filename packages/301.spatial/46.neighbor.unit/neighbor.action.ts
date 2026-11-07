import { Action } from '../99.core/interface/action.interface'
import NeighborBit from './fce/neighbor.bit'

// Neighbor actions

export const INIT_NEIGHBOR = '[Neighbor action] Init Neighbor'
export class InitNeighbor implements Action {
    readonly type = INIT_NEIGHBOR
    constructor(public bale: NeighborBit) {}
}

export const UPDATE_NEIGHBOR = '[Neighbor action] Update Neighbor'
export class UpdateNeighbor implements Action {
    readonly type = UPDATE_NEIGHBOR
    constructor(public bale: NeighborBit) {}
}

export type Actions = InitNeighbor | UpdateNeighbor
