import type { Action } from '../99.core/interface/action.interface.js'
import EventsBit from './fce/events.bit.js'

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

export const RECORD_SPATIAL_EVENT = '[Events action] Record Spatial Event'
export class RecordSpatialEvent implements Action {
    readonly type = RECORD_SPATIAL_EVENT
    constructor(public bale: EventsBit) {}
}

export type Actions = InitEvents | UpdateEvents | RecordSpatialEvent
