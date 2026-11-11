import clone from 'clone-deep'
import * as Act from './collect.action.js'
import { CollectModel } from './collect.model.js'
import * as Buzz from './collect.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: CollectModel = new CollectModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_COLLECT:
            return Buzz.initCollect(clone(model), act.bale, state)

        case Act.EXECUTE_BATCH:
            return Buzz.executeBatch(clone(model), act.bale, state)

        default:
            return model
    }
}
