import { Action } from '../99.core/interface/action.interface'
import EventsBit from './fce/events.bit'

// Events actions

export const INIT_EVENTS = '[Events action] Init Events'
export class InitEvents implements Action {
    readonly type = INIT_EVENTS
    constructor(public bale: EventsBit) {}
}

export const UPDATE_EVENTS = '[Events action] Update Events'
export class UpdateEvents implements Action {
    readonly type = UPDATE_EVENTS
    constructor(public bale: EventsBit) {}
}

export type Actions = InitEvents | UpdateEvents
