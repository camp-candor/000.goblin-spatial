/**
 * ============================================================================
 * :: LATTICE STATE MODEL (01.lattice.unit)
 * ============================================================================
 */

import type Lattice from './fce/lattice.interface.js';
import type { TacticalCellId } from './fce/lattice.interface.js';

export class LatticeModel implements Lattice {
    idx: string = '01.lattice';
    originPacked: TacticalCellId = 2147516416 as TacticalCellId; // packAxialCell(0, 0)
    scaleMultiplier: number = 2;
}

export default LatticeModel;
