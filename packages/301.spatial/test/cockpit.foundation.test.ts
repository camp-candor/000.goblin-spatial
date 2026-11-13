import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    initializeCockpitHarness,
    CockpitInstance,
} from '../val/000.spatial.pvt.js'

describe('Phase 1 Local Terminal Cockpit Foundation', () => {
    let cockpit: CockpitInstance

    beforeEach(() => {
        cockpit = initializeCockpitHarness()
    })

    afterEach(() => {
        cockpit.destroy()
    })

    it('initializes menu with default diagnostic actions', () => {
        const catalog = cockpit.menu.getCatalog()
        expect(catalog.actions.length).toBeGreaterThanOrEqual(3)
        expect(catalog.actions[0].shortcut).toBe('D01')
        expect(catalog.actions[1].shortcut).toBe('D02')
        expect(catalog.actions[2].shortcut).toBe('D03')
    })

    it('cycles menu selection forward and backward cleanly', () => {
        cockpit.menu.selectNext()
        expect(cockpit.menu.getCatalog().activeIndex).toBe(1)

        cockpit.menu.selectPrevious()
        expect(cockpit.menu.getCatalog().activeIndex).toBe(0)

        cockpit.menu.selectPrevious()
        expect(cockpit.menu.getCatalog().activeIndex).toBe(
            cockpit.menu.getCatalog().actions.length - 1,
        )
    })

    it('dispatches selected action through reactive bus without throwing', async () => {
        let resetEmitted = false
        cockpit.bus.subscribe('KERNEL_STATE_RESET', () => {
            resetEmitted = true
        })

        await cockpit.menu.executeSelected()
        expect(resetEmitted).toBe(true)
    })

    it('renders 7-bit clean ASCII telemetry frame within 2ms budget', () => {
        const start = performance.now()
        const frame = cockpit.renderTelemetryFrame()
        const duration = performance.now() - start

        expect(duration).toBeLessThanOrEqual(2.0)
        expect(frame).toContain('000.goblin-spatial')
        expect(frame).toContain('D01')
        // Assert pure 7-bit ASCII
        expect(/^[\x00-\x7F]*$/.test(frame)).toBe(true)
    })

    it('rejects duplicate action IDs during registration', () => {
        expect(() => {
            cockpit.menu.registerAction({
                id: 'D01_RESET_KERNEL',
                label: 'Conflicting Action',
                shortcut: 'D99',
                category: 'DIAGNOSTIC',
                execute: async () => {},
            })
        }).toThrowError(/DUPLICATE_ACTION_ID/)
    })
})
