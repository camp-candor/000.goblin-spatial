import PortBit from './port.bit'

export default interface Port {
    // idx:string;
    // portBitList: PortBit[];
    // portBits:any;
}

import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js';
import { BasisPoints } from '../../40.witness.unit/fce/witness.interface.js';
import { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js';

export type SpatialQueryType =
  | 'RAYCAST'
  | 'ACOUSTIC_WAVEFRONT'
  | 'BOUNDED_PATH'
  | 'REACHABILITY'
  | 'DISPLACEMENT_EVICTION';

export interface ScrubbedRaycastQuery {
  readonly queryType: 'RAYCAST';
  readonly origin: AxialCoord;
  readonly target: AxialCoord;
  readonly thresholdBps?: BasisPoints;
  readonly calculationMode?: 'SUBTRACTIVE_LINEAR' | 'MULTIPLICATIVE_BEER_LAMBERT';
}

export interface ScrubbedAcousticQuery {
  readonly queryType: 'ACOUSTIC_WAVEFRONT';
  readonly sourceCoord: AxialCoord;
  readonly sourceIntensityCdb: CentiDecibels;
  readonly ambientNoiseFloorCdb: CentiDecibels;
  readonly hearingThresholdCdb?: CentiDecibels;
  readonly snrMinCdb?: CentiDecibels;
  readonly workEnvelopeLimit?: number;
}

export interface ScrubbedRoutingQuery {
  readonly queryType: 'BOUNDED_PATH';
  readonly origin: AxialCoord;
  readonly destination: AxialCoord;
  readonly maxBudgetCostUnits: number;
  readonly blockedCells?: readonly PackedAxial[];
  readonly workEnvelopeLimit?: number;
  readonly episodeSeed?: number;
}

export interface ScrubbedReachabilityQuery {
  readonly queryType: 'REACHABILITY';
  readonly origin: AxialCoord;
  readonly budgetCostUnits: number;
  readonly blockedCells?: readonly PackedAxial[];
  readonly workEnvelopeLimit?: number;
}

export interface ScrubbedDisplacementQuery {
  readonly queryType: 'DISPLACEMENT_EVICTION';
  readonly congestedCell: AxialCoord;
  readonly budgetCostUnits?: number;
  readonly blockedCells?: readonly PackedAxial[];
  readonly workEnvelopeLimit?: number;
  readonly seedDigest?: number;
}

export type ScrubbedSpatialQuery =
  | ScrubbedRaycastQuery
  | ScrubbedAcousticQuery
  | ScrubbedRoutingQuery
  | ScrubbedReachabilityQuery
  | ScrubbedDisplacementQuery;

export interface QueryStripValidationResult<T extends ScrubbedSpatialQuery = ScrubbedSpatialQuery> {
  readonly valid: boolean;
  readonly query?: T;
  readonly errors: readonly string[];
  readonly strippedKeyCount: number;
}
