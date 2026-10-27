import { Action } from '../99.core/interface/action.interface'
import FrontierBit from './fce/frontier.bit'

// Frontier actions

export const INIT_FRONTIER = '[Frontier action] Init Frontier'
export class InitFrontier implements Action {
    readonly type = INIT_FRONTIER
    constructor(public bale: FrontierBit) {}
}

export const UPDATE_FRONTIER = '[Frontier action] Update Frontier'
export class UpdateFrontier implements Action {
    readonly type = UPDATE_FRONTIER
    constructor(public bale: FrontierBit) {}
}

export type Actions = InitFrontier | UpdateFrontier
