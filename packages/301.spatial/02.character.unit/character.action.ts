import { Action } from '../99.core/interface/action.interface'
import CharacterBit from './fce/character.bit'

// Character actions

export const INIT_CHARACTER = '[Character action] Init Character'
export class InitCharacter implements Action {
    readonly type = INIT_CHARACTER
    constructor(public bale: CharacterBit) {}
}

export const UPDATE_CHARACTER = '[Character action] Update Character'
export class UpdateCharacter implements Action {
    readonly type = UPDATE_CHARACTER
    constructor(public bale: CharacterBit) {}
}

export type Actions = InitCharacter | UpdateCharacter
