import clone from 'clone-deep'
import * as Act from './port.action.js'
import { PortModel } from './port.model.js'
import * as Buzz from './port.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: PortModel = new PortModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_PORT:
            return Buzz.initPort(clone(model), act.bale, state)

        case Act.EXECUTE_QUERY:
            return Buzz.executeQuery(clone(model), act.bale, state)

        case Act.SANITIZE_QUERY:
            return Buzz.sanitizeQuery(clone(model), act.bale, state)

        default:
            return model
    }
}
