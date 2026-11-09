import { describe, it, expect } from 'vitest'
import {
    createAxialCoord,
    packAxial,
    PackedAxial,
} from '../28.axial.unit/val/axial.model.js'
import {
    compareTieBreakNodes,
    TieBreakNode,
} from '../25.distance.unit/buz/distance.buzz.js'
import {
    getMobilityProfile,
    scaleTraversalCostByMobility,
} from '../37.trauma.unit/buz/trauma.buzz.js'
import { computeReachableCells } from '../24.frontier.unit/buz/frontier.buzz.js'
import { findShortestBoundedPath } from '../43.path.unit/buz/path.buzz.js'
import { createRoutingKernel } from '../20.kernel.unit/buz/kernel.buzz.js'
import { createPathSimulationAction } from '../98.menu.unit/buz/05.path-menu.buzz.js'
import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js'

describe('Phase 6 Budget-Bounded Traversal Routing Solver', () => {
    it('enforces 4-tier deterministic tie-break sorting order', () => {
        const target = createAxialCoord(2, 2)

        // Node A and Node B have identical fScore (100) and gScore (50)
        // Node A is closer in chord distance to target
        const nodeA: TieBreakNode = {
            cell: packAxial(1, 1),
            fScore: 100,
            gScore: 50,
            hScore: 50,
            seedDigest: 10,
        }
        const nodeB: TieBreakNode = {
            cell: packAxial(0, 0),
            fScore: 100,
            gScore: 50,
            hScore: 50,
            seedDigest: 10,
        }

        const diff = compareTieBreakNodes(nodeA, nodeB, target)
        expect(diff).toBeLessThan(0) // Node A chosen first (closer chord distance)
    })

    it('scales traversal costs by mobility class without floats', () => {
        const standard = getMobilityProfile('STANDARD')
        const encumbered = getMobilityProfile('ENCUMBERED')
        const limping = getMobilityProfile('LIMPING')
        const immobilized = getMobilityProfile('IMMOBILIZED')

        expect(scaleTraversalCostByMobility(100, standard)).toBe(100)
        expect(scaleTraversalCostByMobility(100, encumbered)).toBe(150)
        expect(scaleTraversalCostByMobility(100, limping)).toBe(200)
        expect(scaleTraversalCostByMobility(100, immobilized)).toBe(
            Number.POSITIVE_INFINITY,
        )
    })

    it('computes reachable cell horizons within movement budget', () => {
        const origin = createAxialCoord(0, 0)
        // Budget 200 allows 2 steps (step cost 100)
        const res = computeReachableCells({
            origin,
            budgetCostUnits: 200,
            workEnvelopeLimit: 512,
        })

        expect(res.breachedEnvelope).toBe(false)
        expect(res.reachable.size).toBe(19) // Hex disk radius 2 has 19 cells
        expect(res.reachable.get(packAxial(0, 0))).toBe(0)
        expect(res.reachable.get(packAxial(1, 0))).toBe(100)
        expect(res.reachable.get(packAxial(2, 0))).toBe(200)
        // 3 steps away should not be reachable
        expect(res.reachable.has(packAxial(3, 0))).toBe(false)
    })

    it('navigates shortest path around obstacle walls', () => {
        const origin = createAxialCoord(-2, 0)
        const destination = createAxialCoord(2, 0)
        // Wall blocks direct line at (0, 0)
        const blockedCells = new Set<PackedAxial>([packAxial(0, 0)])

        const result = findShortestBoundedPath({
            origin,
            destination,
            maxBudgetCostUnits: 1000,
            blockedCells,
        })

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.path.length).toBeGreaterThan(1)
            // Path must not contain blocked wall
            const hasWall = result.pathPacked.includes(packAxial(0, 0))
            expect(hasWall).toBe(false)
            expect(result.totalCostUnits).toBe(500) // 5 steps detour
        }
    })

    it('halts pathfinding cleanly at 512 expansions when budget is exceeded', () => {
        const origin = createAxialCoord(0, 0)
        const destination = createAxialCoord(300, 300)

        const result = findShortestBoundedPath({
            origin,
            destination,
            maxBudgetCostUnits: 100000,
            workEnvelopeLimit: 512,
        })

        expect(result.ok).toBe(false)
        if (result.ok === false) {
            expect(result.reason).toBe('BUDGET_EXCEEDED')
            expect(result.expandedSteps).toBe(513)
        }
    })

    it('dispatches ROU01 menu action within 2ms execution budget', async () => {
        const action = createPathSimulationAction()
        const bus = createSpatialBus()
        const logs: string[] = []

        bus.subscribe('TELEMETRY_LOG', (evt) => {
            logs.push(String(evt.payload.message || ''))
        })

        const start = performance.now()
        await action.execute(bus)
        const elapsed = performance.now() - start

        expect(elapsed).toBeLessThanOrEqual(2.0)
        expect(logs.some((l) => l.includes('[ROU01] Bounded Pathfind'))).toBe(
            true,
        )
        expect(logs.some((l) => l.includes('Status: FOUND'))).toBe(true)
    })
})
