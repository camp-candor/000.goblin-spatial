import { Action } from '../99.core/interface/action.interface'
import SpaceBit from './fce/space.bit'

// Space actions

export const INIT_SPACE = '[Space action] Init Space'
export class InitSpace implements Action {
    readonly type = INIT_SPACE
    constructor(public bale: SpaceBit) {}
}

export const UPDATE_SPACE = '[Space action] Update Space'
export class UpdateSpace implements Action {
    readonly type = UPDATE_SPACE
    constructor(public bale: SpaceBit) {}
}

export const TEST_SPACE = '[Test action] Test Space'
export class TestSpace implements Action {
    readonly type = TEST_SPACE
    constructor(public bale: SpaceBit) {}
}

export type Actions = InitSpace | UpdateSpace | TestSpace
