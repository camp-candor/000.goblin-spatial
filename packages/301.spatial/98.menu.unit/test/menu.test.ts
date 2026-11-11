import { describe, it, expect, beforeEach } from 'vitest'
import { MenuModel } from '../menu.model.js'
import { SPATIAL_MENU_CHOICES } from '../val/menu.model.js'
import {
    initMenu,
    updateMenu,
    executeBoundaryVerification,
    testWorkBudgetTripwires,
} from '../buz/00.menu.buzz.js'
import { runOpticalReciprocityAudit } from '../buz/02.topology-menu.buzz.js'
import type MenuBit from '../fce/menu.bit.js'

describe('98.menu.unit - Blessed Terminal Interface Switchboard', () => {
    let model: MenuModel

    beforeEach(() => {
        model = new MenuModel()
    })

    describe('Headless CI Resilience & Choice Registrations', () => {
        it('degrades gracefully in headless environment without crashing', async () => {
            let emittedList: any = null

            const bale: MenuBit = {
                idx: 'test-headless',
                slv: (res) => {
                    emittedList = res.mnuBit.lst
                },
            }

            await updateMenu(model, bale)

            expect(emittedList).toBeDefined()
            expect(emittedList).toEqual(SPATIAL_MENU_CHOICES)
            expect(emittedList).toContain(
                '[01] LOAD CANONICAL TOPOLOGY MANIFEST',
            )
            expect(emittedList).toContain('[02] RUN SYNCHRONOUS PORT PROBE')
            expect(emittedList).toContain(
                '[03] EXECUTE 8,190-PAIR OPTICAL RECIPROCITY AUDIT',
            )
            expect(emittedList).toContain('[04] TEST WORK BUDGET TRIPWIRES')
            expect(emittedList).toContain('[ROOT MENU]')
        })
    })

    describe('Boundary Verification & Tripwires', () => {
        it('executes boundary verification in local isolate', async () => {
            let resolvedVal = 0
            const bale: MenuBit = {
                idx: 'boundary-check',
                slv: (res) => {
                    resolvedVal = res.mnuBit.val ?? 0
                },
            }

            await executeBoundaryVerification(model, bale)
            expect(resolvedVal).toBe(1)
            expect(model.statusMessage).toBe('BOUNDARY_VERIFIED')
        })

        it('tests work budget tripwires and asserts deterministic budget exceeded', async () => {
            let passedVal = 0
            const bale: MenuBit = {
                idx: 'budget-check',
                slv: (res) => {
                    passedVal = res.mnuBit.val ?? 0
                },
            }

            await testWorkBudgetTripwires(model, bale)
            expect(passedVal).toBe(1)
            expect(model.statusMessage).toBe('TRIPWIRES_CERTIFIED')
        })
    })

    describe('8,190-Pair Optical Reciprocity Audit', () => {
        it('verifies 100% symmetric transmission across 91-cell hex lattice', async () => {
            const mockState: any = { hunt: async () => ({}) }
            const passed = await runOpticalReciprocityAudit(mockState)
            expect(passed).toBe(true)
        })
    })
})
