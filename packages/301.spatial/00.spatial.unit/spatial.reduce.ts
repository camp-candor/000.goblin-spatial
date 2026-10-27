import clone from 'clone-deep'
import * as Act from './spatial.action'
import { SpatialModel } from './spatial.model'
import * as Buzz from './spatial.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SpatialModel = new SpatialModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SPATIAL:
            return Buzz.updateSpatial(clone(model), act.bale, state)

        case Act.INIT_SPATIAL:
            return Buzz.initSpatial(clone(model), act.bale, state)

        default:
            return model
    }
}
