import {
  PureSpatialKernel,
  SpatialExecutionContext,
  SpatialPort,
  SynchronousExecutionReceipt
} from '../fce/spatial.interface.js';
import { DEFAULT_KERNEL_VERSION } from '../val/spatial.model.js';
import {
  ScrubbedAcousticQuery,
  ScrubbedDisplacementQuery,
  ScrubbedRaycastQuery,
  ScrubbedReachabilityQuery,
  ScrubbedRoutingQuery,
  ScrubbedSpatialQuery,
  SpatialQueryType
} from '../../14.port.unit/fce/port.interface.js';
import { scrubAndValidateSpatialQuery } from '../../14.port.unit/buz/port.buzz.js';
import { PerceptCandidate } from '../../42.receipt.unit/fce/receipt.interface.js';
import { emitOpticalPerceptCandidate } from '../../42.receipt.unit/buz/receipt.buzz.js';
import { computeOpticalTransmission } from '../../40.witness.unit/buz/witness.buzz.js';
import { AcousticWavefrontResult } from '../../13.sound.unit/fce/sound.interface.js';
import { computeAcousticWavefront } from '../../13.sound.unit/buz/sound.buzz.js';
import { createPartitionRegistry } from '../../49.edge.unit/buz/edge.buzz.js';
import { findShortestBoundedPath, PathQueryResult } from '../../43.path.unit/buz/path.buzz.js';
import { computeReachableCells, ReachableCellsResult } from '../../24.frontier.unit/buz/frontier.buzz.js';
import { resolveDisplacement, DisplacementResult } from '../../50.displacement.unit/buz/displacement.buzz.js';
import { createCapacityEvaluator } from '../../51.capacity.unit/buz/capacity.buzz.js';
import { createOccupancyTracker } from '../../44.occupancy.unit/buz/occupancy.buzz.js';
import {
  canonicalizeJCS,
  createSpatialLedgerLogger,
  sha256Hex,
  SpatialLedgerLogger
} from '../../19.ledger.unit/buz/ledger.buzz.js';
import { SpatialAuditQuadruple, SpatialLedgerEntry } from '../../19.ledger.unit/fce/ledger.interface.js';
import { packAxial } from '../../28.axial.unit/val/axial.model.js';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj as object)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj as Readonly<T>;
}

export class SpatialKernelInvoker implements PureSpatialKernel {
  public readonly kernelVersion: string;
  private readonly defaultTopologyHash: string;
  private readonly defaultOverlayHash: string;
  private readonly ledgerLoggers = new Map<string, SpatialLedgerLogger>();

  constructor(options?: {
    kernelVersion?: string;
    defaultTopologyHash?: string;
    defaultOverlayHash?: string;
  }) {
    this.kernelVersion = options?.kernelVersion ?? DEFAULT_KERNEL_VERSION;
    this.defaultTopologyHash =
      options?.defaultTopologyHash ?? sha256Hex('CANONICAL_TOPOLOGY_ROOT_DEFAULT');
    this.defaultOverlayHash =
      options?.defaultOverlayHash ?? sha256Hex('EMPTY_DYNAMIC_OVERLAY_DEFAULT');
  }

  public executeRaycast(
    query: ScrubbedRaycastQuery,
    context?: SpatialExecutionContext
  ): PerceptCandidate {
    const topoHash = context?.topologyHash ?? this.defaultTopologyHash;
    const ovlHash = context?.overlayHash ?? this.defaultOverlayHash;

    const transmission = computeOpticalTransmission(
      {
        origin: query.origin,
        target: query.target,
        traversedCells: [],
        thresholdBps: query.thresholdBps,
        calculationMode: query.calculationMode
      },
      () => 0 as any
    );

    return emitOpticalPerceptCandidate(query.origin, query.target, transmission, {
      topologyRootHash: topoHash,
      overlayRootHash: ovlHash
    });
  }

  public executeAcousticWavefront(
    query: ScrubbedAcousticQuery,
    context?: SpatialExecutionContext
  ): AcousticWavefrontResult {
    const registry = createPartitionRegistry();
    return computeAcousticWavefront(
      {
        sourceCoord: query.sourceCoord,
        sourceIntensityCdb: query.sourceIntensityCdb,
        ambientNoiseFloorCdb: query.ambientNoiseFloorCdb,
        hearingThresholdCdb: query.hearingThresholdCdb,
        snrMinCdb: query.snrMinCdb,
        workEnvelopeLimit: query.workEnvelopeLimit
      },
      registry
    );
  }

  public executeBoundedPath(
    query: ScrubbedRoutingQuery,
    context?: SpatialExecutionContext
  ): PathQueryResult {
    const blockedSet = query.blockedCells ? new Set(query.blockedCells) : undefined;
    return findShortestBoundedPath({
      origin: query.origin,
      destination: query.destination,
      maxBudgetCostUnits: query.maxBudgetCostUnits,
      blockedCells: blockedSet,
      workEnvelopeLimit: query.workEnvelopeLimit,
      episodeSeed: query.episodeSeed
    });
  }

  public executeReachability(
    query: ScrubbedReachabilityQuery,
    context?: SpatialExecutionContext
  ): ReachableCellsResult {
    const blockedSet = query.blockedCells ? new Set(query.blockedCells) : undefined;
    return computeReachableCells({
      origin: query.origin,
      budgetCostUnits: query.budgetCostUnits,
      blockedCells: blockedSet,
      workEnvelopeLimit: query.workEnvelopeLimit
    });
  }

  public executeDisplacement(
    query: ScrubbedDisplacementQuery,
    context?: SpatialExecutionContext
  ): DisplacementResult {
    const capacity = createCapacityEvaluator();
    const occupancy = createOccupancyTracker();
    const blockedSet = query.blockedCells ? new Set(query.blockedCells) : undefined;

    return resolveDisplacement(
      {
        congestedCell: query.congestedCell,
        budgetCostUnits: query.budgetCostUnits,
        blockedCells: blockedSet,
        workEnvelopeLimit: query.workEnvelopeLimit,
        seedDigest: query.seedDigest
      },
      capacity,
      occupancy
    );
  }

  /**
   * Root synchronous entry point: validates schema, executes in-process math,
   * generates provenance quadruple, and logs to ledger if configured.
   */
  public executeSynchronousQuery(
    rawQuery: unknown,
    context?: SpatialExecutionContext
  ): SynchronousExecutionReceipt {
    const startHr = process.hrtime.bigint();

    // 1. Ingress Schema Validation & Epistemic Firewall
    const stripResult = scrubAndValidateSpatialQuery(rawQuery);
    if (!stripResult.valid || !stripResult.query) {
      const errEnd = process.hrtime.bigint();
      const elapsedMicros = Number((errEnd - startHr) / 1000n);
      const errQuadruple: SpatialAuditQuadruple = {
        topologyHash: context?.topologyHash ?? this.defaultTopologyHash,
        overlayHash: context?.overlayHash ?? this.defaultOverlayHash,
        queryHash: sha256Hex(JSON.stringify(rawQuery ?? null)),
        receiptHash: sha256Hex('REJECTED_QUERY_INGRESS')
      };

      return deepFreeze({
        ok: false,
        queryType: (rawQuery as any)?.queryType ?? 'RAYCAST',
        result: null,
        durationMicros: elapsedMicros,
        auditQuadruple: errQuadruple,
        error: stripResult.errors.join('; ')
      });
    }

    const query = stripResult.query;
    let resultPayload: unknown;

    // 2. Pure Synchronous In-Process Dispatch
    switch (query.queryType) {
      case 'RAYCAST':
        resultPayload = this.executeRaycast(query, context);
        break;
      case 'ACOUSTIC_WAVEFRONT':
        resultPayload = this.executeAcousticWavefront(query, context);
        break;
      case 'BOUNDED_PATH':
        resultPayload = this.executeBoundedPath(query, context);
        break;
      case 'REACHABILITY':
        resultPayload = this.executeReachability(query, context);
        break;
      case 'DISPLACEMENT_EVICTION':
        resultPayload = this.executeDisplacement(query, context);
        break;
      default:
        throw new Error(`UNSUPPORTED_QUERY_TYPE: ${(query as any).queryType}`);
    }

    const endHr = process.hrtime.bigint();
    const durationMicros = Number((endHr - startHr) / 1000n);

    // 3. Cryptographic Provenance & Quadruple Generation
    const topologyHash = context?.topologyHash ?? this.defaultTopologyHash;
    const overlayHash = context?.overlayHash ?? this.defaultOverlayHash;
    const queryHash = sha256Hex(canonicalizeJCS(query));
    const receiptHash = sha256Hex(canonicalizeJCS(resultPayload));

    const auditQuadruple: SpatialAuditQuadruple = {
      topologyHash,
      overlayHash,
      queryHash,
      receiptHash
    };

    // 4. Optional Hash Chain Ledger Recording
    let ledgerEntry: SpatialLedgerEntry | undefined = undefined;
    if (context?.recordLedger && context.streamId) {
      let logger = this.ledgerLoggers.get(context.streamId);
      if (!logger) {
        logger = createSpatialLedgerLogger({
          streamId: context.streamId,
          kernelVersion: this.kernelVersion
        });
        this.ledgerLoggers.set(context.streamId, logger);
      }
      ledgerEntry = logger.appendEntry(
        context.currentTick ?? 0,
        query.queryType,
        auditQuadruple
      );
    }

    const receipt: SynchronousExecutionReceipt = {
      ok: true,
      queryType: query.queryType,
      result: resultPayload,
      durationMicros,
      auditQuadruple,
      ledgerEntry
    };

    return deepFreeze(receipt);
  }
}

/**
 * Production In-Process Spatial Adapter implementing SpatialPort.
 * Consumed directly by worker-sower-engine.
 */
export class InProcessSpatialAdapter implements SpatialPort {
  public readonly kernelVersion: string;

  constructor(private readonly kernel: PureSpatialKernel) {
    this.kernelVersion = kernel.kernelVersion;
  }

  public invokeSynchronous<T = unknown>(
    rawQuery: unknown,
    context?: SpatialExecutionContext
  ): SynchronousExecutionReceipt<T> {
    return this.kernel.executeSynchronousQuery(rawQuery, context) as SynchronousExecutionReceipt<T>;
  }
}

export const createSpatialKernel = (options?: {
  kernelVersion?: string;
  defaultTopologyHash?: string;
  defaultOverlayHash?: string;
}): PureSpatialKernel => new SpatialKernelInvoker(options);

export const createInProcessSpatialPort = (
  kernel?: PureSpatialKernel
): SpatialPort => new InProcessSpatialAdapter(kernel ?? createSpatialKernel());
