import { z } from 'zod';
import { Sha256HashSchema } from './ident.schema.js';

/**
 * Ephemeral Dynamic Overlay Delta Schema.
 * Superimposed onto static topology during query execution.
 */
export const DynamicOverlaySchema = z
  .object({
    overlayId: z.string().min(1, { message: '[INVALID_ID] Overlay ID cannot be empty' }),
    parentTopologyHash: Sha256HashSchema,
    occluderOverrides: z.record(
      z.string().regex(/^occ_[a-z0-9_]+$/),
      z.boolean()
    ),
    portalOverrides: z.record(
      z.string().regex(/^prt_[a-z0-9_]+$/),
      z.boolean()
    ),
    attenuationDeltasCdb: z.record(
      z.string(),
      z.number().int({ message: '[FLOAT_PROHIBITED] Attenuation delta must be integer cdB' })
    ),
  })
  .strict();

export type DynamicOverlay = z.infer<typeof DynamicOverlaySchema>;

export interface MergedTopologySnapshot {
  readonly topologyId: string;
  readonly overlayId: string;
  readonly cells: readonly {
    readonly q: number;
    readonly r: number;
    readonly s: number;
    readonly costUnits: number;
    readonly passable: boolean;
  }[];
  readonly portals: readonly {
    readonly portalId: string;
    readonly fromRoomId: string;
    readonly toRoomId: string;
    readonly entryCoord: { readonly q: number; readonly r: number; readonly s: number };
    readonly exitCoord: { readonly q: number; readonly r: number; readonly s: number };
    readonly acousticDampingCdb: number;
    readonly traversable: boolean;
  }[];
  readonly occluders: readonly {
    readonly occluderId: string;
    readonly coord: { readonly q: number; readonly r: number; readonly s: number };
    readonly blocksLoS: boolean;
    readonly attenuationCdb: number;
  }[];
}
