import clone from 'clone-deep'
import * as Act from './axial.action'
import { AxialModel } from './axial.model'
import * as Buzz from './axial.buzzer'
import State from '../99.core/state'

export function reducer(
    model: AxialModel = new AxialModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_AXIAL:
            return Buzz.updateAxial(clone(model), act.bale, state)

        case Act.INIT_AXIAL:
            return Buzz.initAxial(clone(model), act.bale, state)

        default:
            return model
    }
}
