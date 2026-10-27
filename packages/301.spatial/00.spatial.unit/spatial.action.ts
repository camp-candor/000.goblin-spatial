import { Action } from '../99.core/interface/action.interface'
import SpatialBit from './fce/spatial.bit'

// Spatial actions

export const INIT_SPATIAL = '[Spatial action] Init Spatial'
export class InitSpatial implements Action {
    readonly type = INIT_SPATIAL
    constructor(public bale: SpatialBit) {}
}

export const UPDATE_SPATIAL = '[Spatial action] Update Spatial'
export class UpdateSpatial implements Action {
    readonly type = UPDATE_SPATIAL
    constructor(public bale: SpatialBit) {}
}

export type Actions = InitSpatial | UpdateSpatial
