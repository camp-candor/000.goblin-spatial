import clone from 'clone-deep'
import * as Act from './decay.action'
import { DecayModel } from './decay.model'
import * as Buzz from './decay.buzzer'
import State from '../99.core/state'

export function reducer(
    model: DecayModel = new DecayModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_DECAY:
            return Buzz.updateDecay(clone(model), act.bale, state)

        case Act.INIT_DECAY:
            return Buzz.initDecay(clone(model), act.bale, state)

        default:
            return model
    }
}
