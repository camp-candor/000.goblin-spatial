import clone from 'clone-deep'
import * as Act from './lattice.action'
import { LatticeModel } from './lattice.model'
import * as Buzz from './lattice.buzzer'
import State from '../99.core/state'

export function reducer(
    model: LatticeModel = new LatticeModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_LATTICE:
            return Buzz.updateLattice(clone(model), act.bale, state)

        case Act.INIT_LATTICE:
            return Buzz.initLattice(clone(model), act.bale, state)

        default:
            return model
    }
}
