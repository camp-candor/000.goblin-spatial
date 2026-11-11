import type { Action } from '../99.core/interface/action.interface.js';
import type ReceiptBit from './fce/receipt.bit.js';

export const INIT_RECEIPT = '[Receipt action] Init Receipt';
export class InitReceipt implements Action<ReceiptBit> {
  readonly type = INIT_RECEIPT;
  constructor(public bale?: ReceiptBit) {}
}

export const MINT_PATH_RECEIPT = '[Receipt action] Mint Path Receipt';
export class MintPathReceipt implements Action<ReceiptBit> {
  readonly type = MINT_PATH_RECEIPT;
  constructor(public bale?: ReceiptBit) {}
}

export const MINT_PERCEPT_RECEIPT = '[Receipt action] Mint Percept Receipt';
export class MintPerceptReceipt implements Action<ReceiptBit> {
  readonly type = MINT_PERCEPT_RECEIPT;
  constructor(public bale?: ReceiptBit) {}
}

export const MINT_DISPLACEMENT_RECEIPT = '[Receipt action] Mint Displacement Receipt';
export class MintDisplacementReceipt implements Action<ReceiptBit> {
  readonly type = MINT_DISPLACEMENT_RECEIPT;
  constructor(public bale?: ReceiptBit) {}
}

export type Actions =
  | InitReceipt
  | MintPathReceipt
  | MintPerceptReceipt
  | MintDisplacementReceipt;
