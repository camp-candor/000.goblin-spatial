/**
 * ============================================================================
 * :: REDUX ACTION DECLARATIONS (01.lattice.unit)
 * ============================================================================
 */

import type { Action } from '../99.core/interface/action.interface.js';
import type LatticeBit from './fce/lattice.bit.js';
import type {
    ProjectLatticeDat,
    DistanceLatticeDat,
    DiskLatticeDat,
} from './fce/lattice.bit.js';

export const INIT_LATTICE = '[Lattice action] Init Lattice';
export class InitLattice implements Action<LatticeBit> {
    readonly type = INIT_LATTICE;
    constructor(public bale: LatticeBit) {}
}

export const PROJECT_LATTICE = '[Lattice action] Project Lattice';
export class ProjectLattice implements Action<LatticeBit<ProjectLatticeDat>> {
    readonly type = PROJECT_LATTICE;
    constructor(public bale: LatticeBit<ProjectLatticeDat>) {}
}

export const DISTANCE_LATTICE = '[Distance action] Distance Lattice';
export class DistanceLattice implements Action<LatticeBit<DistanceLatticeDat>> {
    readonly type = DISTANCE_LATTICE;
    constructor(public bale: LatticeBit<DistanceLatticeDat>) {}
}

export const DISK_LATTICE = '[Disk action] Disk Lattice';
export class DiskLattice implements Action<LatticeBit<DiskLatticeDat>> {
    readonly type = DISK_LATTICE;
    constructor(public bale: LatticeBit<DiskLatticeDat>) {}
}

export type Actions =
    | InitLattice
    | ProjectLattice
    | DistanceLattice
    | DiskLattice;
