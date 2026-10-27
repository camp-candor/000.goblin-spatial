import clone from 'clone-deep'
import * as Act from './origin.action'
import { OriginModel } from './origin.model'
import * as Buzz from './origin.buzzer'
import State from '../99.core/state'

export function reducer(
    model: OriginModel = new OriginModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_ORIGIN:
            return Buzz.updateOrigin(clone(model), act.bale, state)

        case Act.INIT_ORIGIN:
            return Buzz.initOrigin(clone(model), act.bale, state)

        default:
            return model
    }
}
