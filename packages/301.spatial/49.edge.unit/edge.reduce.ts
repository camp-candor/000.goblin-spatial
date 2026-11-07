import clone from 'clone-deep'
import * as Act from './edge.action'
import { EdgeModel } from './edge.model'
import * as Buzz from './edge.buzzer'
import State from '../99.core/state'

export function reducer(
    model: EdgeModel = new EdgeModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_EDGE:
            return Buzz.updateEdge(clone(model), act.bale, state)

        case Act.INIT_EDGE:
            return Buzz.initEdge(clone(model), act.bale, state)

        default:
            return model
    }
}
