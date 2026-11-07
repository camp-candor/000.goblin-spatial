import clone from 'clone-deep'
import * as Act from './capacity.action'
import { CapacityModel } from './capacity.model'
import * as Buzz from './capacity.buzzer'
import State from '../99.core/state'

export function reducer(
    model: CapacityModel = new CapacityModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CAPACITY:
            return Buzz.updateCapacity(clone(model), act.bale, state)

        case Act.INIT_CAPACITY:
            return Buzz.initCapacity(clone(model), act.bale, state)

        default:
            return model
    }
}
