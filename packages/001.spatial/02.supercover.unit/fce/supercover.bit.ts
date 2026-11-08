/**
 * ============================================================================
 * :: REDUX-RXJS ACTION PAYLOAD ENVELOPE (02.supercover.unit)
 * ============================================================================
 */

import type {
    SegmentIntersectionResult,
    CrossedFeature,
} from './supercover.interface.js';
import type { LatticePoint } from '../../01.lattice.unit/index.js';

export interface IntersectSegmentDat {
    readonly p1: LatticePoint;
    readonly p2: LatticePoint;
    readonly e1: LatticePoint;
    readonly e2: LatticePoint;
    readonly result: SegmentIntersectionResult;
}

export interface TraceSupercoverDat {
    readonly originCell: number;
    readonly targetCell: number;
    readonly features: readonly CrossedFeature[];
}

export default interface SupercoverBit<TDat = unknown, TLst = CrossedFeature> {
    idx: string;
    src?: string;
    val?: number;
    lst?: readonly TLst[];
    dat?: TDat;
    slv?: (result: { spcBit: Partial<SupercoverBit<TDat, TLst>> }) => void;
}
