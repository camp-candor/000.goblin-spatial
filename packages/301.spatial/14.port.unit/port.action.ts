import { Action } from '../99.core/interface/action.interface'
import PortBit from './fce/port.bit'

// Port actions

export const INIT_PORT = '[Port action] Init Port'
export class InitPort implements Action {
    readonly type = INIT_PORT
    constructor(public bale: PortBit) {}
}

export const UPDATE_PORT = '[Port action] Update Port'
export class UpdatePort implements Action {
    readonly type = UPDATE_PORT
    constructor(public bale: PortBit) {}
}

export type Actions = InitPort | UpdatePort
