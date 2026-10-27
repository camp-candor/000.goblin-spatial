import clone from 'clone-deep'
import * as Act from './intent.action'
import { IntentModel } from './intent.model'
import * as Buzz from './intent.buzzer'
import State from '../99.core/state'

export function reducer(
    model: IntentModel = new IntentModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_INTENT:
            return Buzz.updateIntent(clone(model), act.bale, state)

        case Act.INIT_INTENT:
            return Buzz.initIntent(clone(model), act.bale, state)

        default:
            return model
    }
}
