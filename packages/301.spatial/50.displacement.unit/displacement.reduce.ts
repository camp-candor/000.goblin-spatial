import clone from 'clone-deep'
import * as Act from './displacement.action'
import { DisplacementModel } from './displacement.model'
import * as Buzz from './displacement.buzzer'
import State from '../99.core/state'

export function reducer(
    model: DisplacementModel = new DisplacementModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_DISPLACEMENT:
            return Buzz.updateDisplacement(clone(model), act.bale, state)

        case Act.INIT_DISPLACEMENT:
            return Buzz.initDisplacement(clone(model), act.bale, state)

        default:
            return model
    }
}
