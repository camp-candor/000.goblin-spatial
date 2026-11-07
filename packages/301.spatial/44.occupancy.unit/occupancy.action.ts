import { Action } from '../99.core/interface/action.interface'
import OccupancyBit from './fce/occupancy.bit'

// Occupancy actions

export const INIT_OCCUPANCY = '[Occupancy action] Init Occupancy'
export class InitOccupancy implements Action {
    readonly type = INIT_OCCUPANCY
    constructor(public bale: OccupancyBit) {}
}

export const UPDATE_OCCUPANCY = '[Occupancy action] Update Occupancy'
export class UpdateOccupancy implements Action {
    readonly type = UPDATE_OCCUPANCY
    constructor(public bale: OccupancyBit) {}
}

export type Actions = InitOccupancy | UpdateOccupancy
