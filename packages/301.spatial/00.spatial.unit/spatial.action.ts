import type { Action } from '../99.core/interface/action.interface.js'
import type SpatialBit from './fce/spatial.bit.js'

export const INIT_SPATIAL = '[Spatial action] Init Spatial'
export class InitSpatial implements Action<SpatialBit> {
    readonly type = INIT_SPATIAL
    constructor(public bale?: SpatialBit) {}
}

export const INVOKE_SYNCHRONOUS = '[Spatial action] Invoke Synchronous'
export class InvokeSynchronous implements Action<SpatialBit> {
    readonly type = INVOKE_SYNCHRONOUS
    constructor(public bale?: SpatialBit) {}
}

export const UPDATE_SPATIAL = '[Spatial action] Update Spatial'
export class UpdateSpatial implements Action<SpatialBit> {
    readonly type = UPDATE_SPATIAL
    constructor(public bale?: SpatialBit) {}
}

export type Actions = InitSpatial | InvokeSynchronous | UpdateSpatial
