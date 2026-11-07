import { Action } from '../99.core/interface/action.interface'
import ReceiptBit from './fce/receipt.bit'

// Receipt actions

export const INIT_RECEIPT = '[Receipt action] Init Receipt'
export class InitReceipt implements Action {
    readonly type = INIT_RECEIPT
    constructor(public bale: ReceiptBit) {}
}

export const UPDATE_RECEIPT = '[Receipt action] Update Receipt'
export class UpdateReceipt implements Action {
    readonly type = UPDATE_RECEIPT
    constructor(public bale: ReceiptBit) {}
}

export type Actions = InitReceipt | UpdateReceipt
