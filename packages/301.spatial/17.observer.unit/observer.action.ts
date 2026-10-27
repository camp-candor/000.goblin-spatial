import { Action } from '../99.core/interface/action.interface'
import ObserverBit from './fce/observer.bit'

// Observer actions

export const INIT_OBSERVER = '[Observer action] Init Observer'
export class InitObserver implements Action {
    readonly type = INIT_OBSERVER
    constructor(public bale: ObserverBit) {}
}

export const UPDATE_OBSERVER = '[Observer action] Update Observer'
export class UpdateObserver implements Action {
    readonly type = UPDATE_OBSERVER
    constructor(public bale: ObserverBit) {}
}

export type Actions = InitObserver | UpdateObserver
