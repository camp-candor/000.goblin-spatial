import type { Action } from '../99.core/interface/action.interface.js'
import type LedgerBit from './fce/ledger.bit.js'

export const INIT_LEDGER = '[Ledger action] Init Ledger'
export class InitLedger implements Action<LedgerBit> {
    readonly type = INIT_LEDGER
    constructor(public bale?: LedgerBit) {}
}

export const APPEND_ENTRY = '[Ledger action] Append Entry'
export class AppendEntry implements Action<LedgerBit> {
    readonly type = APPEND_ENTRY
    constructor(public bale?: LedgerBit) {}
}

export const VERIFY_LINEAGE = '[Ledger action] Verify Lineage'
export class VerifyLineage implements Action<LedgerBit> {
    readonly type = VERIFY_LINEAGE
    constructor(public bale?: LedgerBit) {}
}

export type Actions = InitLedger | AppendEntry | VerifyLineage
