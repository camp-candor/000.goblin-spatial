import { describe, it, expect } from 'vitest'
import {
    calculateAcousticPropagation,
    validatePortalReciprocity,
} from '../buz/spatial.buzz.js'
import { LocationSchema } from '../fce/spatial.schema.js'
import type { Location } from '../fce/spatial.schema.js'

describe('01.location.unit - Spatial Topology & Acoustic Propagation', () => {
    it('strictly parses a valid crawlspace room node', () => {
        const validRoom = {
            schema_version: 1,
            id: 'loc_warm_pipe',
            name: 'The Warm Pipe Hub',
            max_occupancy: 2,
            ambient_noise_cdb: 1500,
            temperature_bp: 7500,
            portals: [
                {
                    portal_id: 'prt_warm_pipe_to_pantry',
                    target_location_id: 'loc_pantry_wall',
                    target_portal_id: 'prt_pantry_to_warm_pipe',
                    acoustic_dampening_cdb: 1800,
                    traversal_cost: 120,
                    is_passable: true,
                    is_latched: false,
                },
            ],
        }

        expect(LocationSchema.safeParse(validRoom).success).toBe(true)

        const extraKeys = { ...validRoom, secret_tunnel: true }
        expect(LocationSchema.safeParse(extraKeys).success).toBe(false)
    })

    it('evaluates integer acoustic decay across multi-portal paths', () => {
        const portals = [
            {
                portal_id: 'prt_1',
                target_location_id: 'loc_b',
                target_portal_id: 'prt_2',
                acoustic_dampening_cdb: 1200,
                traversal_cost: 100,
                is_passable: true,
                is_latched: false,
            },
            {
                portal_id: 'prt_3',
                target_location_id: 'loc_c',
                target_portal_id: 'prt_4',
                acoustic_dampening_cdb: 2500,
                traversal_cost: 150,
                is_passable: true,
                is_latched: false,
            },
        ]

        const sourceSoundCdb = 5000
        expect(calculateAcousticPropagation(sourceSoundCdb, portals)).toBe(1300)

        const quietSound = 2000
        expect(calculateAcousticPropagation(quietSound, portals)).toBe(0)
    })

    it('catches asymmetric portal traps and self-adjacency', () => {
        const brokenNetwork: Location[] = [
            {
                schema_version: 1,
                id: 'loc_warm_pipe',
                name: 'Warm Pipe',
                max_occupancy: 2,
                ambient_noise_cdb: 1500,
                temperature_bp: 6000,
                portals: [
                    {
                        portal_id: 'prt_pipe_out',
                        target_location_id: 'loc_pantry_wall',
                        target_portal_id: 'prt_pantry_in',
                        acoustic_dampening_cdb: 1200,
                        traversal_cost: 100,
                        is_passable: true,
                        is_latched: false,
                    },
                ],
            },
            {
                schema_version: 1,
                id: 'loc_pantry_wall',
                name: 'Pantry Wall',
                max_occupancy: 4,
                ambient_noise_cdb: 2000,
                temperature_bp: 4000,
                portals: [],
            },
        ]

        const check = validatePortalReciprocity(brokenNetwork)
        expect(check.valid).toBe(false)
        expect(
            check.errors.some((e) => e.includes('ASYMMETRIC_PORTAL_TRAP')),
        ).toBe(true)
    })

    it('accepts a fully reciprocal portal network', () => {
        const healthyNetwork: Location[] = [
            {
                schema_version: 1,
                id: 'loc_warm_pipe',
                name: 'Warm Pipe',
                max_occupancy: 2,
                ambient_noise_cdb: 1500,
                temperature_bp: 6000,
                portals: [
                    {
                        portal_id: 'prt_pipe_out',
                        target_location_id: 'loc_pantry_wall',
                        target_portal_id: 'prt_pantry_in',
                        acoustic_dampening_cdb: 1200,
                        traversal_cost: 100,
                        is_passable: true,
                        is_latched: false,
                    },
                ],
            },
            {
                schema_version: 1,
                id: 'loc_pantry_wall',
                name: 'Pantry Wall',
                max_occupancy: 4,
                ambient_noise_cdb: 2000,
                temperature_bp: 4000,
                portals: [
                    {
                        portal_id: 'prt_pantry_in',
                        target_location_id: 'loc_warm_pipe',
                        target_portal_id: 'prt_pipe_out',
                        acoustic_dampening_cdb: 1200,
                        traversal_cost: 100,
                        is_passable: true,
                        is_latched: false,
                    },
                ],
            },
        ]

        const check = validatePortalReciprocity(healthyNetwork)
        expect(check.valid).toBe(true)
        expect(check.errors).toEqual([])
    })
})
