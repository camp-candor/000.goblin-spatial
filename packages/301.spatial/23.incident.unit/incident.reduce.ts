import clone from 'clone-deep'
import * as Act from './incident.action'
import { IncidentModel } from './incident.model'
import * as Buzz from './incident.buzzer'
import State from '../99.core/state'

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

        default:
            return model
    }
}
