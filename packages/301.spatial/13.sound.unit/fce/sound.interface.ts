import { AxialCoord, PackedAxial } from '../../28.axial.unit/val/axial.model.js';

export type CentiDecibels = number & { readonly __brand: unique symbol };

export type SoundFrequencyBand =
  | 'LOW_RESONANCE_METALLIC'
  | 'MID_VOICE'
  | 'HIGH_TRANSIENT';

export interface AcousticNodeReceipt {
  readonly coord: AxialCoord;
  readonly packed: PackedAxial;
  readonly arrivingIntensityCdb: CentiDecibels;
  readonly pathLossCdb: CentiDecibels;
  readonly arrivalBearing: number; // 0..5 (Direction on hex lattice from listener to previous node)
  readonly predecessorPacked?: PackedAxial;
  readonly hops: number;
}

export interface AuditoryPerceptReceipt {
  readonly listenerCoord: AxialCoord;
  readonly listenerPacked: PackedAxial;
  readonly sourceCoord: AxialCoord;
  readonly sourcePacked: PackedAxial;
  readonly arrivingIntensityCdb: CentiDecibels;
  readonly signalToNoiseRatioCdb: CentiDecibels;
  readonly auditoryQualityPermille: number; // 0..1000
  readonly absoluteArrivalBearing: number; // 0..5
  readonly isAudible: boolean;
}

export interface AcousticWavefrontQuery {
  readonly sourceCoord: AxialCoord;
  readonly sourceIntensityCdb: CentiDecibels;
  readonly frequencyBand?: SoundFrequencyBand;
  readonly ambientNoiseFloorCdb: CentiDecibels;
  readonly hearingThresholdCdb?: CentiDecibels;
  readonly snrMinCdb?: CentiDecibels;
  readonly workEnvelopeLimit?: number;
}

export interface AcousticWavefrontResult {
  readonly sourcePacked: PackedAxial;
  readonly evaluatedNodes: ReadonlyMap<PackedAxial, AcousticNodeReceipt>;
  readonly prunedFrontierCount: number;
  readonly executionSteps: number;
  readonly breachedEnvelopeLimit: boolean;
}

export default interface Sound {
  idx:string;
}

export interface SoundBit {}
