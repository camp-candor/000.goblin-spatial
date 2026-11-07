import clone from 'clone-deep'
import * as Act from './path.action'
import { PathModel } from './path.model'
import * as Buzz from './path.buzzer'
import State from '../99.core/state'

export function reducer(
    model: PathModel = new PathModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_PATH:
            return Buzz.updatePath(clone(model), act.bale, state)

        case Act.INIT_PATH:
            return Buzz.initPath(clone(model), act.bale, state)

        default:
            return model
    }
}
