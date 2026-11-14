import clone from 'clone-deep'
import * as Act from './events.action.js'
import { EventsModel } from './events.model.js'
import * as Buzz from './events.buzzer.js'
import State from '../99.core/state.js'

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

        case Act.RECORD_SPATIAL_EVENT:
            return Buzz.recordSpatialEvent(clone(model), act.bale, state)

        default:
            return model
    }
}
