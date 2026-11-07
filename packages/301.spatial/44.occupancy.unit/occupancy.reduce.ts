import clone from 'clone-deep'
import * as Act from './occupancy.action'
import { OccupancyModel } from './occupancy.model'
import * as Buzz from './occupancy.buzzer'
import State from '../99.core/state'

export function reducer(
    model: OccupancyModel = new OccupancyModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_OCCUPANCY:
            return Buzz.updateOccupancy(clone(model), act.bale, state)

        case Act.INIT_OCCUPANCY:
            return Buzz.initOccupancy(clone(model), act.bale, state)

        default:
            return model
    }
}
