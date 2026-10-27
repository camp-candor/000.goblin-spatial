/**
 * ============================================================================
 * :: REDUX-RXJS ACTION PAYLOAD ENVELOPE (01.lattice.unit)
 * ============================================================================
 * Follows the canonical LibraryBit pattern for reactive state dispatching.
 */

import type {
    TacticalCellId,
    TacticalEdgeId,
    AxialCoord,
    LatticePoint,
    HexVertices,
} from './lattice.interface.js'

export interface ProjectLatticeDat {
    readonly coord: AxialCoord
    readonly centroid: LatticePoint
    readonly vertices: HexVertices
}

export interface DistanceLatticeDat {
    readonly from: TacticalCellId
    readonly to: TacticalCellId
    readonly distance: number
}

export interface DiskLatticeDat {
    readonly center: TacticalCellId
    readonly radius: number
    readonly cellCount: number
    readonly cells: readonly TacticalCellId[]
}

export default interface LatticeBit<TDat = unknown, TLst = TacticalCellId> {
    idx: string
    src?: string
    val?: number
    lst?: readonly TLst[]
    dat?: TDat
    slv?: (result: { ltcBit: Partial<LatticeBit<TDat, TLst>> }) => void
}
