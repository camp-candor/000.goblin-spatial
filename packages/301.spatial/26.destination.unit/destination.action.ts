import { Action } from '../99.core/interface/action.interface'
import DestinationBit from './fce/destination.bit'

// Destination actions

export const INIT_DESTINATION = '[Destination action] Init Destination'
export class InitDestination implements Action {
    readonly type = INIT_DESTINATION
    constructor(public bale: DestinationBit) {}
}

export const UPDATE_DESTINATION = '[Destination action] Update Destination'
export class UpdateDestination implements Action {
    readonly type = UPDATE_DESTINATION
    constructor(public bale: DestinationBit) {}
}

export type Actions = InitDestination | UpdateDestination
