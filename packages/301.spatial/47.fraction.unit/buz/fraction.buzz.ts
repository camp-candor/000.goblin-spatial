import { CentiDecibels } from '../../13.sound.unit/fce/sound.interface.js';
import { FractionModel } from '../fraction.model.js';
import FractionBit from '../fce/fraction.bit.js';
import State from '../../99.core/state.js';

/**
 * Normalized per-mille auditory quality score [0, 1000]:
 * Q = clamp(floor((I_arrival - (N_ambient + SNR_min)) / (I_ref - (N_ambient + SNR_min)) * 1000), 0, 1000)
 */
export function computeAuditoryQualityPermille(
  arrivingIntensityCdb: CentiDecibels,
  ambientNoiseFloorCdb: CentiDecibels,
  snrMinCdb: CentiDecibels,
  referenceSourceCdb: CentiDecibels
): number {
  const baseline = ambientNoiseFloorCdb + snrMinCdb;
  const numerator = arrivingIntensityCdb - baseline;
  const denominator = referenceSourceCdb - baseline;

  if (denominator <= 0 || numerator <= 0) {
    return 0;
  }

  const scaled = Math.trunc((numerator * 1000) / denominator);
  if (scaled < 0) return 0;
  if (scaled > 1000) return 1000;
  return scaled;
}

export const initFraction = (cpy: FractionModel, bal: FractionBit, ste: State) => { return cpy; };
export const updateFraction = (cpy: FractionModel, bal: FractionBit, ste: State) => { return cpy; };
