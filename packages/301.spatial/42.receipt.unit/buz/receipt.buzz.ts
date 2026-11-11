import { ReceiptModel } from '../receipt.model.js';
import type ReceiptBit from '../fce/receipt.bit.js';
import type State from '../../99.core/state.js';
import type {
  PathReceipt,
  PerceptCandidate,
  DisplacementReceipt,
} from '../fce/receipt.interface.js';
import {
  PathReceiptSchema,
  PerceptCandidateSchema,
  DisplacementReceiptSchema,
} from '../val/receipt.model.js';

/**
 * Deep freezes an object recursively to guarantee plain data immutability.
 */
export function deepFreezeReceipt<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreezeReceipt(val);
    }
  }
  return obj;
}

export const initReceipt = (
  cpy: ReceiptModel,
  bal?: ReceiptBit,
  ste?: State
): ReceiptModel => {
  cpy.totalPathReceiptsMinted = 0;
  cpy.totalPerceptReceiptsMinted = 0;
  cpy.totalDisplacementReceiptsMinted = 0;
  cpy.lastMintedTimestamp = 0;

  if (bal?.slv) {
    bal.slv({ rcpBit: { idx: 'init-receipt-success', val: 1 } });
  }
  return cpy;
};

export const mintPathReceipt = (
  cpy: ReceiptModel,
  bal?: ReceiptBit,
  ste?: State
): ReceiptModel => {
  const candidate = bal?.dat?.pathReceipt;
  const parsed = PathReceiptSchema.safeParse(candidate);

  if (!parsed.success) {
    if (bal?.slv) {
      bal.slv({
        rcpBit: {
          idx: 'mint-path-receipt-fail',
          val: 0,
          dat: { error: `[PATH_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}` },
        },
      });
    }
    return cpy;
  }

  const sealedReceipt = deepFreezeReceipt(parsed.data as PathReceipt);
  cpy.totalPathReceiptsMinted += 1;
  cpy.lastMintedTimestamp = Date.now();

  if (bal?.slv) {
    bal.slv({
      rcpBit: {
        idx: 'mint-path-receipt-success',
        val: 1,
        dat: { pathReceipt: sealedReceipt },
      },
    });
  }
  return cpy;
};

export const mintPerceptReceipt = (
  cpy: ReceiptModel,
  bal?: ReceiptBit,
  ste?: State
): ReceiptModel => {
  const candidate = bal?.dat?.perceptCandidate;
  const parsed = PerceptCandidateSchema.safeParse(candidate);

  if (!parsed.success) {
    if (bal?.slv) {
      bal.slv({
        rcpBit: {
          idx: 'mint-percept-receipt-fail',
          val: 0,
          dat: { error: `[PERCEPT_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}` },
        },
      });
    }
    return cpy;
  }

  const sealedCandidate = deepFreezeReceipt(parsed.data as PerceptCandidate);
  cpy.totalPerceptReceiptsMinted += 1;
  cpy.lastMintedTimestamp = Date.now();

  if (bal?.slv) {
    bal.slv({
      rcpBit: {
        idx: 'mint-percept-receipt-success',
        val: 1,
        dat: { perceptCandidate: sealedCandidate },
      },
    });
  }
  return cpy;
};

export const mintDisplacementReceipt = (
  cpy: ReceiptModel,
  bal?: ReceiptBit,
  ste?: State
): ReceiptModel => {
  const candidate = bal?.dat?.displacementReceipt;
  const parsed = DisplacementReceiptSchema.safeParse(candidate);

  if (!parsed.success) {
    if (bal?.slv) {
      bal.slv({
        rcpBit: {
          idx: 'mint-displacement-receipt-fail',
          val: 0,
          dat: { error: `[DISPLACEMENT_RECEIPT_SCHEMA_BREACH] ${parsed.error.errors.map((e) => e.message).join('; ')}` },
        },
      });
    }
    return cpy;
  }

  const sealedDisplacement = deepFreezeReceipt(parsed.data as DisplacementReceipt);
  cpy.totalDisplacementReceiptsMinted += 1;
  cpy.lastMintedTimestamp = Date.now();

  if (bal?.slv) {
    bal.slv({
      rcpBit: {
        idx: 'mint-displacement-receipt-success',
        val: 1,
        dat: { displacementReceipt: sealedDisplacement },
      },
    });
  }
  return cpy;
};
