import type { Action } from '../99.core/interface/action.interface.js'
import type ClockBit from './fce/clock.bit.js'

// Clock actions

export const INIT_CLOCK = '[Clock action] Init Clock'
export class InitClock implements Action {
    readonly type = INIT_CLOCK
    constructor(public bale?: ClockBit) {}
}

export const UPDATE_CLOCK = '[Clock action] Update Clock'
export class UpdateClock implements Action {
    readonly type = UPDATE_CLOCK
    constructor(public bale?: ClockBit) {}
}

export const SYNC_SPATIAL_CLOCK = '[Clock action] Sync Spatial Clock'
export class SyncSpatialClock implements Action {
    readonly type = SYNC_SPATIAL_CLOCK
    constructor(public bale?: ClockBit) {}
}

export const DERIVE_DIURNAL_PROFILE = '[Clock action] Derive Diurnal Profile'
export class DeriveDiurnalProfile implements Action {
    readonly type = DERIVE_DIURNAL_PROFILE
    constructor(public bale?: ClockBit) {}
}

export type Actions =
    InitClock | UpdateClock | SyncSpatialClock | DeriveDiurnalProfile

export const DERIVE_DIURNAL_PROFILE_ACTION = DERIVE_DIURNAL_PROFILE
export const SYNC_SPATIAL_CLOCK_ACTION = SYNC_SPATIAL_CLOCK
