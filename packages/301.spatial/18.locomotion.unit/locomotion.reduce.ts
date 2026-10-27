import clone from 'clone-deep'
import * as Act from './locomotion.action'
import { LocomotionModel } from './locomotion.model'
import * as Buzz from './locomotion.buzzer'
import State from '../99.core/state'

export function reducer(
    model: LocomotionModel = new LocomotionModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_LOCOMOTION:
            return Buzz.updateLocomotion(clone(model), act.bale, state)

        case Act.INIT_LOCOMOTION:
            return Buzz.initLocomotion(clone(model), act.bale, state)

        default:
            return model
    }
}
