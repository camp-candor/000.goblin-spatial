/**
 * ============================================================================
 * :: REDUX REDUCER (01.lattice.unit)
 * ============================================================================
 */

import clone from 'clone-deep'
import * as Act from './lattice.action.js'
import { LatticeModel } from './lattice.model.js'
import * as Buzz from './lattice.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LatticeModel = new LatticeModel(),
    act: Act.Actions,
    state?: State,
): LatticeModel {
    switch (act.type) {
        case Act.INIT_LATTICE:
            return Buzz.initLattice(clone(model, true), act.bale, state)

        case Act.PROJECT_LATTICE:
            return Buzz.projectLattice(
                clone(model, true),
                act.bale as any,
                state,
            )

        case Act.DISTANCE_LATTICE:
            return Buzz.distanceLattice(
                clone(model, true),
                act.bale as any,
                state,
            )

        case Act.DISK_LATTICE:
            return Buzz.diskLattice(clone(model, true), act.bale as any, state)

        default:
            return model
    }
}
