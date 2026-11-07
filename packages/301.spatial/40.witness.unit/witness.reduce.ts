import clone from 'clone-deep'
import * as Act from './witness.action'
import { WitnessModel } from './witness.model'
import * as Buzz from './witness.buzzer'
import State from '../99.core/state'

export function reducer(
    model: WitnessModel = new WitnessModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_WITNESS:
            return Buzz.updateWitness(clone(model), act.bale, state)

        case Act.INIT_WITNESS:
            return Buzz.initWitness(clone(model), act.bale, state)

        default:
            return model
    }
}
