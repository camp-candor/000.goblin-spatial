import { Action } from '../99.core/interface/action.interface'
import NodeBit from './fce/node.bit'

// Node actions

export const INIT_NODE = '[Node action] Init Node'
export class InitNode implements Action {
    readonly type = INIT_NODE
    constructor(public bale: NodeBit) {}
}

export const UPDATE_NODE = '[Node action] Update Node'
export class UpdateNode implements Action {
    readonly type = UPDATE_NODE
    constructor(public bale: NodeBit) {}
}

export type Actions = InitNode | UpdateNode
