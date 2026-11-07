import { Action } from '../99.core/interface/action.interface'
import PathBit from './fce/path.bit'

// Path actions

export const INIT_PATH = '[Path action] Init Path'
export class InitPath implements Action {
    readonly type = INIT_PATH
    constructor(public bale: PathBit) {}
}

export const UPDATE_PATH = '[Path action] Update Path'
export class UpdatePath implements Action {
    readonly type = UPDATE_PATH
    constructor(public bale: PathBit) {}
}

export type Actions = InitPath | UpdatePath
