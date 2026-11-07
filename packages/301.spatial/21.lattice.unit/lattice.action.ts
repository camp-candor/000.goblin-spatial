import { Action } from '../99.core/interface/action.interface'
import LatticeBit from './fce/lattice.bit'

// Lattice actions

export const INIT_LATTICE = '[Lattice action] Init Lattice'
export class InitLattice implements Action {
    readonly type = INIT_LATTICE
    constructor(public bale: LatticeBit) {}
}

export const UPDATE_LATTICE = '[Lattice action] Update Lattice'
export class UpdateLattice implements Action {
    readonly type = UPDATE_LATTICE
    constructor(public bale: LatticeBit) {}
}

export type Actions = InitLattice | UpdateLattice
