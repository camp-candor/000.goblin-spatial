import clone from 'clone-deep'
import * as Act from './fraction.action'
import { FractionModel } from './fraction.model'
import * as Buzz from './fraction.buzzer'
import State from '../99.core/state'

export function reducer(
    model: FractionModel = new FractionModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_FRACTION:
            return Buzz.updateFraction(clone(model), act.bale, state)

        case Act.INIT_FRACTION:
            return Buzz.initFraction(clone(model), act.bale, state)

        default:
            return model
    }
}
