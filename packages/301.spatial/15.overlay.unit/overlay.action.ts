import { Action } from '../99.core/interface/action.interface'
import OverlayBit from './fce/overlay.bit'

// Overlay actions

export const INIT_OVERLAY = '[Overlay action] Init Overlay'
export class InitOverlay implements Action {
    readonly type = INIT_OVERLAY
    constructor(public bale: OverlayBit) {}
}

export const UPDATE_OVERLAY = '[Overlay action] Update Overlay'
export class UpdateOverlay implements Action {
    readonly type = UPDATE_OVERLAY
    constructor(public bale: OverlayBit) {}
}

export type Actions = InitOverlay | UpdateOverlay
