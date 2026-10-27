import { Action } from '../99.core/interface/action.interface'
import IncidentBit from './fce/incident.bit'

// Incident actions

export const INIT_INCIDENT = '[Incident action] Init Incident'
export class InitIncident implements Action {
    readonly type = INIT_INCIDENT
    constructor(public bale: IncidentBit) {}
}

export const UPDATE_INCIDENT = '[Incident action] Update Incident'
export class UpdateIncident implements Action {
    readonly type = UPDATE_INCIDENT
    constructor(public bale: IncidentBit) {}
}

export type Actions = InitIncident | UpdateIncident
