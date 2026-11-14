import type { Action } from '../99.core/interface/action.interface.js'
import IncidentBit from './fce/incident.bit.js'

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

export const EVALUATE_INCIDENT_WITNESSES =
    '[Incident action] Evaluate Incident Witnesses'
export class EvaluateIncidentWitnesses implements Action {
    readonly type = EVALUATE_INCIDENT_WITNESSES
    constructor(public bale: IncidentBit) {}
}

export type Actions = InitIncident | UpdateIncident | EvaluateIncidentWitnesses
