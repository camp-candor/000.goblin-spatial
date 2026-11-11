import type { Unit } from '../99.core/interface/unit.interface.js';
import { LedgerModel } from './ledger.model.js';
import { reducer } from './ledger.reduce.js';

export default class LedgerUnit implements Unit<LedgerModel> {
  idx: string = '19.ledger';
  model: LedgerModel = new LedgerModel();
  reducer = reducer;
}
