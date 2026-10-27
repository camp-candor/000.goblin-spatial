import clone from 'clone-deep'
import * as Act from './escalation.action'
import { EscalationModel } from './escalation.model'
import * as Buzz from './escalation.buzzer'
import State from '../99.core/state'

export function reducer(
    model: EscalationModel = new EscalationModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_ESCALATION:
            return Buzz.updateEscalation(clone(model), act.bale, state)

        case Act.INIT_ESCALATION:
            return Buzz.initEscalation(clone(model), act.bale, state)

        default:
            return model
    }
}
