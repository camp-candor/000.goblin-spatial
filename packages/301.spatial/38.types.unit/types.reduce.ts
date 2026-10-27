import clone from 'clone-deep'
import * as Act from './types.action'
import { TypesModel } from './types.model'
import * as Buzz from './types.buzzer'
import State from '../99.core/state'

export function reducer(
    model: TypesModel = new TypesModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_TYPES:
            return Buzz.updateTypes(clone(model), act.bale, state)

        case Act.INIT_TYPES:
            return Buzz.initTypes(clone(model), act.bale, state)

        default:
            return model
    }
}
