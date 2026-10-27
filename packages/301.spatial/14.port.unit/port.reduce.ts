import clone from 'clone-deep'
import * as Act from './port.action'
import { PortModel } from './port.model'
import * as Buzz from './port.buzzer'
import State from '../99.core/state'

export function reducer(
    model: PortModel = new PortModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_PORT:
            return Buzz.updatePort(clone(model), act.bale, state)

        case Act.INIT_PORT:
            return Buzz.initPort(clone(model), act.bale, state)

        default:
            return model
    }
}
