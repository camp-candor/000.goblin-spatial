/**
 * ============================================================================
 * :: 02.SUPERCOVER.UNIT BARREL EXPORTS
 * ============================================================================
 */

export type {
    RationalParam,
    SegmentIntersectionKind,
    SegmentIntersectionResult,
    CrossedFeatureKind,
    CrossedFeature,
    default as Supercover,
} from './fce/supercover.interface.js';

export type {
    default as SupercoverBit,
    IntersectSegmentDat,
    TraceSupercoverDat,
} from './fce/supercover.bit.js';

export {
    crossProduct,
    isPointInBoundingBox,
    isPointOnSegment,
    compareRationals,
    classifySegmentEdgeIntersection,
} from './buz/cross-product.buzz.js';
