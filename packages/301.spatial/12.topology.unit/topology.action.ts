import { Action } from '../99.core/interface/action.interface'
import TopologyBit from './fce/topology.bit'

// Topology actions

export const INIT_TOPOLOGY = '[Topology action] Init Topology'
export class InitTopology implements Action {
    readonly type = INIT_TOPOLOGY
    constructor(public bale: TopologyBit) {}
}

export const UPDATE_TOPOLOGY = '[Topology action] Update Topology'
export class UpdateTopology implements Action {
    readonly type = UPDATE_TOPOLOGY
    constructor(public bale: TopologyBit) {}
}

export type Actions = InitTopology | UpdateTopology
