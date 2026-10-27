import { Action } from '../99.core/interface/action.interface'
import EscalationBit from './fce/escalation.bit'

// Escalation actions

export const INIT_ESCALATION = '[Escalation action] Init Escalation'
export class InitEscalation implements Action {
    readonly type = INIT_ESCALATION
    constructor(public bale: EscalationBit) {}
}

export const UPDATE_ESCALATION = '[Escalation action] Update Escalation'
export class UpdateEscalation implements Action {
    readonly type = UPDATE_ESCALATION
    constructor(public bale: EscalationBit) {}
}

export type Actions = InitEscalation | UpdateEscalation
