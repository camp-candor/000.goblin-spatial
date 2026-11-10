import { z } from 'zod'
import Ledger from '../fce/ledger.interface.js'
import LedgerBit from '../fce/ledger.interface.js'

export const DEFAULT_KERNEL_VERSION = "0.1.0"
export const GENESIS_PREFIX = "GOBLIN-SPATIAL-GENESIS::"

export const Sha256HashSchema: z.ZodType<string> = z.string().regex(/^[a-f0-9]{64}$/)

export const SpatialAuditQuadrupleSchema: z.ZodType<any> = z.object({
    topologyHash: Sha256HashSchema,
    overlayHash: Sha256HashSchema,
    queryHash: Sha256HashSchema,
    receiptHash: Sha256HashSchema,
}).strict()

export const SpatialLedgerEntrySchema: z.ZodType<any> = z.object({
    seq: z.number().int().nonnegative(),
    tick: z.number().int().nonnegative(),
    streamId: z.string(),
    queryType: z.string(),
    quadruple: SpatialAuditQuadrupleSchema,
    kernelVersion: z.string(),
    eventHash: Sha256HashSchema,
}).strict()

export class LedgerModel implements Ledger {
    //idx:string;
    //ledgerBitList: LedgerBit[] = [];
    //ledgerBits: any = {};
}
