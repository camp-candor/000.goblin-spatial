import { Action } from '../99.core/interface/action.interface'
import SegmentBit from './fce/segment.bit'

// Segment actions

export const INIT_SEGMENT = '[Segment action] Init Segment'
export class InitSegment implements Action {
    readonly type = INIT_SEGMENT
    constructor(public bale: SegmentBit) {}
}

export const UPDATE_SEGMENT = '[Segment action] Update Segment'
export class UpdateSegment implements Action {
    readonly type = UPDATE_SEGMENT
    constructor(public bale: SegmentBit) {}
}

export type Actions = InitSegment | UpdateSegment
