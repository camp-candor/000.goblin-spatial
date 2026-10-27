import clone from 'clone-deep'
import * as Act from './laws.action'
import { LawsModel } from './laws.model'
import * as Buzz from './laws.buzzer'
import State from '../99.core/state'

export function reducer(
    model: LawsModel = new LawsModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_LAWS:
            return Buzz.updateLaws(clone(model), act.bale, state)

        case Act.INIT_LAWS:
            return Buzz.initLaws(clone(model), act.bale, state)

        default:
            return model
    }
}
