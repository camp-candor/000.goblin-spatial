import clone from 'clone-deep'
import * as Act from './verbs.action'
import { VerbsModel } from './verbs.model'
import * as Buzz from './verbs.buzzer'
import State from '../99.core/state'

export function reducer(
    model: VerbsModel = new VerbsModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_VERBS:
            return Buzz.updateVerbs(clone(model), act.bale, state)

        case Act.INIT_VERBS:
            return Buzz.initVerbs(clone(model), act.bale, state)

        default:
            return model
    }
}
