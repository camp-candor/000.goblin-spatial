/**
 * ============================================================================
 * :: 41.SEGMENT.UNIT BARREL EXPORTS
 * ============================================================================
 */

export type {
    default as Segment,
    SegmentContactKind,
    BigIntFraction,
    TraversedHexFeature,
    SegmentTraceResult,
    RationalParam,
    SegmentIntersectionKind,
    SegmentIntersectionResult,
    CrossedFeatureKind,
    CrossedFeature,
    Supercover,
} from './fce/segment.interface.js'

export type {
    default as SegmentBit,
    SupercoverBit,
    IntersectSegmentDat,
    TraceSupercoverDat,
} from './fce/segment.bit.js'

export {
    crossProductBigInt,
    clipSegmentAgainstHex,
    traceFiniteSupercover,
    hasLineOfSightFinite,
    initSegment,
    updateSegment,
} from './buz/segment.buzz.js'

export {
    crossProduct,
    isPointInBoundingBox,
    isPointOnSegment,
    compareRationals,
    classifySegmentEdgeIntersection,
} from './buz/cross-product.buzz.js'
