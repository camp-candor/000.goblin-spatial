import clone from 'clone-deep'
import * as Act from './distance.action'
import { DistanceModel } from './distance.model'
import * as Buzz from './distance.buzzer'
import State from '../99.core/state'

export function reducer(
    model: DistanceModel = new DistanceModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_DISTANCE:
            return Buzz.updateDistance(clone(model), act.bale, state)

        case Act.INIT_DISTANCE:
            return Buzz.initDistance(clone(model), act.bale, state)

        default:
            return model
    }
}
