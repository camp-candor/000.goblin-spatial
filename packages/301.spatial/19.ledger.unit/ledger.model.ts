import type Ledger from './fce/ledger.interface.js';
import type { SpatialLedgerEntry } from './fce/ledger.interface.js';
import { GENESIS_HASH_64 } from './val/ledger.model.js';

export class LedgerModel implements Ledger {
  idx: string = '19.ledger';
  headSequence: number = 0;
  lastEventHash: string = GENESIS_HASH_64;
  totalEntriesCommitted: number = 0;
  entries: readonly SpatialLedgerEntry[] = Object.freeze([]);
}

export default LedgerModel;
