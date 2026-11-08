export const initOverlay = (cpy: OverlayModel, bal: OverlayBit, ste: State) => {
    debugger
    return cpy
}

export const updateOverlay = (
    cpy: OverlayModel,
    bal: OverlayBit,
    ste: State,
) => {
    return cpy
}

import { OverlayModel } from '../overlay.model'
import OverlayBit from '../fce/overlay.bit'
import State from '../../99.core/state'

import {
  DynamicOverlay,
  DynamicOverlaySchema,
  PortalEdge,
  OccluderDefinition
} from '../../38.types.unit/fce/manifest.schema.js';

export function createEmptyOverlay(overlayId: string): DynamicOverlay {
  return DynamicOverlaySchema.parse({
    overlayId,
    occluderOverrides: {},
    portalOverrides: {},
    attenuationDeltasCdb: {}
  });
}

export function setOccluderOverride(
  overlay: DynamicOverlay,
  occluderId: string,
  blocked: boolean
): DynamicOverlay {
  return {
    ...overlay,
    occluderOverrides: {
      ...overlay.occluderOverrides,
      [occluderId]: blocked
    }
  };
}

export function setPortalOverride(
  overlay: DynamicOverlay,
  portalId: string,
  traversable: boolean
): DynamicOverlay {
  return {
    ...overlay,
    portalOverrides: {
      ...overlay.portalOverrides,
      [portalId]: traversable
    }
  };
}

export function setAttenuationDelta(
  overlay: DynamicOverlay,
  key: string,
  deltaCdb: number
): DynamicOverlay {
  if (!Number.isInteger(deltaCdb)) {
    throw new TypeError(`ATTENUATION_NON_INTEGER: deltaCdb must be integer (${deltaCdb})`);
  }
  return {
    ...overlay,
    attenuationDeltasCdb: {
      ...overlay.attenuationDeltasCdb,
      [key]: deltaCdb
    }
  };
}

export function isPortalTraversable(portal: PortalEdge, overlay?: DynamicOverlay): boolean {
  if (overlay && portal.portalId in overlay.portalOverrides) {
    return overlay.portalOverrides[portal.portalId];
  }
  return portal.traversableDefault;
}

export function isOccluderBlocking(
  occluder: OccluderDefinition,
  overlay?: DynamicOverlay
): boolean {
  if (overlay && occluder.occluderId in overlay.occluderOverrides) {
    return overlay.occluderOverrides[occluder.occluderId];
  }
  return occluder.blocksLoSDefault;
}

export function getEffectiveAttenuation(
  key: string,
  baseCdb: number,
  overlay?: DynamicOverlay
): number {
  const delta = overlay?.attenuationDeltasCdb[key] ?? 0;
  return Math.max(0, baseCdb + delta);
}
