import clone from 'clone-deep'
import * as Act from './incident.action.js'
import { IncidentModel } from './incident.model.js'
import * as Buzz from './incident.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: IncidentModel = new IncidentModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_INCIDENT:
            return Buzz.updateIncident(clone(model), act.bale, state)

        case Act.INIT_INCIDENT:
            return Buzz.initIncident(clone(model), act.bale, state)

        case Act.EVALUATE_INCIDENT_WITNESSES:
            return Buzz.updateIncident(clone(model), act.bale, state)

        default:
            return model
    }
}
