import { describe, it, expect } from 'vitest'
import { createReceiptVerificationAction } from '../98.menu.unit/buz/07.receipt-menu.buzz.js'
import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js'
import { initializeCockpitHarness } from '../val/000.spatial.pvt.js'

describe('Task 8.6 Terminal Query Receipt Verification Menu Action', () => {
    it('registers REC01 action in cockpit harness catalog', () => {
        const cockpit = initializeCockpitHarness()
        const catalog = cockpit.menu.getCatalog()

        const recAction = catalog.actions.find(
            (a) => a.id === 'REC01_INSPECT_RECEIPT',
        )
        expect(recAction).toBeDefined()
        expect(recAction?.label).toContain('Inspect Query Hash Receipt')
        expect(recAction?.shortcut).toBe('REC01')
        expect(recAction?.category).toBe('DIAGNOSTIC')

        cockpit.destroy()
    })

    it('executes REC01 action and verifies 100% cryptographic parity in cns00 telemetry', async () => {
        const bus = createSpatialBus()
        const action = createReceiptVerificationAction()
        const logs: string[] = []

        bus.subscribe('TELEMETRY_LOG', (evt) => {
            logs.push(String(evt.payload.message || ''))
        })

        const start = performance.now()
        await action.execute(bus)
        const duration = performance.now() - start

        expect(duration).toBeLessThanOrEqual(2.0)
        expect(
            logs.some((l) =>
                l.includes(
                    'Initiating Synchronous Query & Cryptographic Audit',
                ),
            ),
        ).toBe(true)
        expect(
            logs.some(
                (l) => l.includes('Query Hash:') && l.includes('[MATCH: OK]'),
            ),
        ).toBe(true)
        expect(
            logs.some(
                (l) => l.includes('Receipt Hash:') && l.includes('[MATCH: OK]'),
            ),
        ).toBe(true)
        expect(
            logs.some((l) => l.includes('[100% PARITY CERTIFIED: OK]')),
        ).toBe(true)
    })

    it('renders REC01 cleanly in cockpit telemetry text frame', () => {
        const cockpit = initializeCockpitHarness()
        const frame = cockpit.renderTelemetryFrame()

        expect(frame).toContain(
            '000.goblin-spatial :: BLESSED TERMINAL COCKPIT (Phase 8)',
        )
        expect(frame).toContain(
            '[REC01] [REC01] Inspect Query Hash Receipt (DIAGNOSTIC)',
        )

        cockpit.destroy()
    })
})
