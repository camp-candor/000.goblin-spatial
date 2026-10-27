import clone from 'clone-deep'
import * as Act from './destination.action'
import { DestinationModel } from './destination.model'
import * as Buzz from './destination.buzzer'
import State from '../99.core/state'

export function reducer(
    model: DestinationModel = new DestinationModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_DESTINATION:
            return Buzz.updateDestination(clone(model), act.bale, state)

        case Act.INIT_DESTINATION:
            return Buzz.initDestination(clone(model), act.bale, state)

        default:
            return model
    }
}
