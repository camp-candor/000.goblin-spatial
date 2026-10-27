import clone from 'clone-deep'
import * as Act from './events.action'
import { EventsModel } from './events.model'
import * as Buzz from './events.buzzer'
import State from '../99.core/state'

export function reducer(
    model: EventsModel = new EventsModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_EVENTS:
            return Buzz.updateEvents(clone(model), act.bale, state)

        case Act.INIT_EVENTS:
            return Buzz.initEvents(clone(model), act.bale, state)

        default:
            return model
    }
}
