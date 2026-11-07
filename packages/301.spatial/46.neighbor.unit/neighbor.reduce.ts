import clone from 'clone-deep'
import * as Act from './neighbor.action'
import { NeighborModel } from './neighbor.model'
import * as Buzz from './neighbor.buzzer'
import State from '../99.core/state'

export function reducer(
    model: NeighborModel = new NeighborModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_NEIGHBOR:
            return Buzz.updateNeighbor(clone(model), act.bale, state)

        case Act.INIT_NEIGHBOR:
            return Buzz.initNeighbor(clone(model), act.bale, state)

        default:
            return model
    }
}
