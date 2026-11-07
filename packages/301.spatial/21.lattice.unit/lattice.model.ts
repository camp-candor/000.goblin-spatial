import Lattice, { TacticalCellId } from './fce/lattice.interface'

export class LatticeModel implements Lattice {
    idx: string = '21.lattice'
    originPacked: TacticalCellId = 0 as TacticalCellId
    scaleMultiplier: number = 1
}
