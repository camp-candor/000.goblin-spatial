import clone from 'clone-deep'
import * as Act from './floor.action'
import { FloorModel } from './floor.model'
import * as Buzz from './floor.buzzer'
import State from '../99.core/state'

export function reducer(
    model: FloorModel = new FloorModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_FLOOR:
            return Buzz.updateFloor(clone(model), act.bale, state)

        case Act.INIT_FLOOR:
            return Buzz.initFloor(clone(model), act.bale, state)

        default:
            return model
    }
}
