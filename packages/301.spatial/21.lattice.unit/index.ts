/**
 * ============================================================================
 * :: 01.LATTICE.UNIT BARREL EXPORTS
 * ============================================================================
 */

export type {
    TacticalCellId,
    TacticalEdgeId,
    AxialCoord,
    LatticePoint,
    HexDirection,
    HexVertices,
    HexEdgeMidpoints,
    BoundarySegment,
    default as Lattice,
} from './fce/lattice.interface.js'

export type {
    default as LatticeBit,
    ProjectLatticeDat,
    DistanceLatticeDat,
    DiskLatticeDat,
} from './fce/lattice.bit.js'

export {
    AXIAL_COORD_MIN,
    AXIAL_COORD_MAX,
    assertIntegerCoordinate,
    createAxialCoord,
    isAxialCoord,
    assertPlanarCubicInvariant,
    asTacticalCellId,
    asTacticalEdgeId,
    createLatticePoint,
} from './fce/lattice.guard.js'

export {
    COORD_OFFSET,
    MAX_PACKED_CELL_ID,
    packAxialCell,
    unpackAxialCell,
    packEdgeKey,
    unpackEdgeKey,
} from './buz/packing.buzz.js'
