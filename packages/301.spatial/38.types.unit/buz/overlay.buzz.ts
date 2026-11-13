import type { TopologyManifest } from '../fce/manifest.schema.js'
import type {
    DynamicOverlay,
    MergedTopologySnapshot,
} from '../fce/overlay.schema.js'

/**
 * Pure in-memory overlay merger.
 * Superimposes dynamic deltas onto the static topology manifest without mutating source records.
 */
export function mergeOverlaySnapshot(
    manifest: TopologyManifest,
    overlay: DynamicOverlay,
): MergedTopologySnapshot {
    const mergedPortals = manifest.portals.map((portal) => {
        const isOverridden = Object.prototype.hasOwnProperty.call(
            overlay.portalOverrides,
            portal.portalId,
        )
        const traversable = isOverridden
            ? overlay.portalOverrides[portal.portalId]
            : portal.traversableDefault
        return Object.freeze({
            portalId: portal.portalId,
            fromRoomId: portal.fromRoomId,
            toRoomId: portal.toRoomId,
            entryCoord: Object.freeze({
                q: portal.entryCoord.q,
                r: portal.entryCoord.r,
                s: portal.entryCoord.s,
            }),
            exitCoord: Object.freeze({
                q: portal.exitCoord.q,
                r: portal.exitCoord.r,
                s: portal.exitCoord.s,
            }),
            acousticDampingCdb: portal.acousticDampingCdb,
            traversable,
        })
    })

    const mergedOccluders = manifest.occluders.map((occ) => {
        const hasLoSOverride = Object.prototype.hasOwnProperty.call(
            overlay.occluderOverrides,
            occ.occluderId,
        )
        const blocksLoS = hasLoSOverride
            ? overlay.occluderOverrides[occ.occluderId]
            : occ.blocksLoSDefault

        const deltaCdb = overlay.attenuationDeltasCdb[occ.occluderId] ?? 0
        const finalAttenuation = Math.max(0, occ.attenuationCdb + deltaCdb)

        return Object.freeze({
            occluderId: occ.occluderId,
            coord: Object.freeze({
                q: occ.coord.q,
                r: occ.coord.r,
                s: occ.coord.s,
            }),
            blocksLoS,
            attenuationCdb: finalAttenuation,
        })
    })

    const mergedCells = manifest.cells.map((cell) =>
        Object.freeze({
            q: cell.coord.q,
            r: cell.coord.r,
            s: cell.coord.s,
            costUnits: cell.costUnits,
            passable: cell.passable,
        }),
    )

    return Object.freeze({
        topologyId: manifest.topologyId,
        overlayId: overlay.overlayId,
        cells: Object.freeze(mergedCells),
        portals: Object.freeze(mergedPortals),
        occluders: Object.freeze(mergedOccluders),
    })
}
