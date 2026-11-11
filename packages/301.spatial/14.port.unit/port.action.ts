import type { Action } from '../99.core/interface/action.interface.js'
import type PortBit from './fce/port.bit.js'

export const INIT_PORT = '[Port action] Init Port'
export class InitPort implements Action<PortBit> {
    readonly type = INIT_PORT
    constructor(public bale?: PortBit) {}
}

export const EXECUTE_QUERY = '[Port action] Execute Query'
export class ExecuteQuery implements Action<PortBit> {
    readonly type = EXECUTE_QUERY
    constructor(public bale?: PortBit) {}
}

export const SANITIZE_QUERY = '[Port action] Sanitize Query'
export class SanitizeQuery implements Action<PortBit> {
    readonly type = SANITIZE_QUERY
    constructor(public bale?: PortBit) {}
}

export type Actions = InitPort | ExecuteQuery | SanitizeQuery
