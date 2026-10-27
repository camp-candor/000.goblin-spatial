import type { Location, Portal } from '../fce/spatial.schema.js'

/**
 * Calculates acoustic decay across traversed topological portals.
 * Uses integer subtraction to eliminate floating-point drift.
 */
export const calculateAcousticPropagation = (
    sourceCdb: number,
    pathPortals: Portal[],
): number => {
    const totalDamping = pathPortals.reduce(
        (sum, p) => sum + p.acoustic_dampening_cdb,
        0,
    )
    return Math.max(0, sourceCdb - totalDamping)
}

/**
 * Verifies reciprocal portal symmetry:
 * If Location A has portal P_1 targeting Location B at portal P_2,
 * Location B must exist and possess portal P_2 targeting Location A at P_1.
 */
export const validatePortalReciprocity = (
    locations: Location[],
): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    const locationMap = new Map<string, Location>()

    for (const loc of locations) {
        locationMap.set(loc.id, loc)
    }

    for (const loc of locations) {
        for (const portal of loc.portals) {
            if (portal.target_location_id === loc.id) {
                errors.push(
                    `SELF_ADJACENCY_VIOLATION: Location ${loc.id} portal ${portal.portal_id} cannot target itself.`,
                )
                continue
            }

            const targetLoc = locationMap.get(portal.target_location_id)
            if (!targetLoc) {
                errors.push(
                    `DANGLING_PORTAL_TARGET: Location ${loc.id} targets missing location ${portal.target_location_id}.`,
                )
                continue
            }

            const reciprocalPortal = targetLoc.portals.find(
                (p) => p.portal_id === portal.target_portal_id,
            )
            if (!reciprocalPortal) {
                errors.push(
                    `ASYMMETRIC_PORTAL_TRAP: Location ${loc.id} connects to ${portal.target_location_id} via ${portal.portal_id}->${portal.target_portal_id}, but reciprocal portal does not exist.`,
                )
                continue
            }

            if (reciprocalPortal.target_location_id !== loc.id) {
                errors.push(
                    `PORTAL_MISDIRECTION: Reciprocal portal ${reciprocalPortal.portal_id} in ${targetLoc.id} targets ${reciprocalPortal.target_location_id} instead of ${loc.id}.`,
                )
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}
