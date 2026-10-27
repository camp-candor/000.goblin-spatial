import { Action } from '../99.core/interface/action.interface'
import CellsBit from './fce/cells.bit'

// Cells actions

export const INIT_CELLS = '[Cells action] Init Cells'
export class InitCells implements Action {
    readonly type = INIT_CELLS
    constructor(public bale: CellsBit) {}
}

export const UPDATE_CELLS = '[Cells action] Update Cells'
export class UpdateCells implements Action {
    readonly type = UPDATE_CELLS
    constructor(public bale: CellsBit) {}
}

export type Actions = InitCells | UpdateCells
