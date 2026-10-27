import clone from 'clone-deep'
import * as Act from './clock.action'
import { ClockModel } from './clock.model'
import * as Buzz from './clock.buzzer'
import State from '../99.core/state'

export function reducer(
    model: ClockModel = new ClockModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CLOCK:
            return Buzz.updateClock(clone(model), act.bale, state)

        case Act.INIT_CLOCK:
            return Buzz.initClock(clone(model), act.bale, state)

        default:
            return model
    }
}
