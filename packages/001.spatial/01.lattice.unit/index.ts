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

export {
    hexCentroid,
    hexVertices,
    hexEdgeMidpoints,
    sharedEdgeEndpoints,
} from './buz/lattice.buzz.js'

export {
    HEX_DIRECTIONS,
    axialDistance,
    axialNeighborInDirection,
    axialNeighbors,
    axialRing,
    axialRange,
    initLattice,
    projectLattice,
    distanceLattice,
    diskLattice,
} from './buz/topology.buzz.js'

export * as LatticeActions from './lattice.action.js'
export { LatticeModel } from './lattice.model.js'
export { reducer as latticeReducer } from './lattice.reduce.js'
export { default as LatticeUnit } from './lattice.unit.js'
