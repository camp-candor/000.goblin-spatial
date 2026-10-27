import clone from 'clone-deep'
import * as Act from './frontier.action'
import { FrontierModel } from './frontier.model'
import * as Buzz from './frontier.buzzer'
import State from '../99.core/state'

export function reducer(
    model: FrontierModel = new FrontierModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_FRONTIER:
            return Buzz.updateFrontier(clone(model), act.bale, state)

        case Act.INIT_FRONTIER:
            return Buzz.initFrontier(clone(model), act.bale, state)

        default:
            return model
    }
}
