import { Action } from '../99.core/interface/action.interface'
import ClockBit from './fce/clock.bit'

// Clock actions

export const INIT_CLOCK = '[Clock action] Init Clock'
export class InitClock implements Action {
    readonly type = INIT_CLOCK
    constructor(public bale: ClockBit) {}
}

export const UPDATE_CLOCK = '[Clock action] Update Clock'
export class UpdateClock implements Action {
    readonly type = UPDATE_CLOCK
    constructor(public bale: ClockBit) {}
}

export type Actions = InitClock | UpdateClock
