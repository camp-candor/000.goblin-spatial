import clone from 'clone-deep'
import * as Act from './space.action'
import { SpaceModel } from './space.model'
import * as Buzz from './space.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SpaceModel = new SpaceModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SPACE:
            return Buzz.updateSpace(clone(model), act.bale, state)

        case Act.INIT_SPACE:
            return Buzz.initSpace(clone(model), act.bale, state)

        case Act.TEST_SPACE:
            return Buzz.testSpace(clone(model), act.bale, state)

        default:
            return model
    }
}
