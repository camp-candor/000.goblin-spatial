import type Receipt from './fce/receipt.interface.js';

export class ReceiptModel implements Receipt {
  idx: string = '42.receipt';
  totalPathReceiptsMinted: number = 0;
  totalPerceptReceiptsMinted: number = 0;
  totalDisplacementReceiptsMinted: number = 0;
  lastMintedTimestamp: number = 0;
}

export default ReceiptModel;
