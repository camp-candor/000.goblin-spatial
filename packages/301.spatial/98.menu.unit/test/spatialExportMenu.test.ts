import { describe, it, expect } from 'vitest'
import { MenuModel } from '../menu.model.js'
import {
    exportSignedSpatialReceiptMenuBuzz,
    EXPORT_RECEIPT_MENU_LABEL,
} from '../buz/00.menu.buzz.js'
import * as Act from '../menu.action.js'
import { reducer } from '../menu.reduce.js'
import type MenuBit from '../fce/menu.bit.js'

describe('98.menu.unit - Spatial Export Menu Trigger', () => {
    it('exports EXPORT_RECEIPT_MENU_LABEL constant', () => {
        expect(EXPORT_RECEIPT_MENU_LABEL).toBe(
            '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE',
        )
    })

    it('dispatches spatial export command and resolves success', async () => {
        const model = new MenuModel()
        let resolved: any = null
        const bale: MenuBit = {
            idx: 'export-spatial-receipt',
            slv: (res) => {
                resolved = res
            },
        }

        const result = await exportSignedSpatialReceiptMenuBuzz(model, bale)

        expect(result.statusMessage).toBe('SPATIAL_RECEIPT_EXPORTED')
        expect(resolved).not.toBeNull()
        expect(resolved.mnuBit.idx).toBe('export-spatial-receipt-success')
        expect(resolved.mnuBit.val).toBe(1)
    })

    it('routes EXPORT_SIGNED_SPATIAL_RECEIPT action through reducer', () => {
        const model = new MenuModel()
        const action = new Act.ExportSignedSpatialReceipt()
        // reducer returns a promise? Buzz function is async, reducer calls it -> returns Promise
        const out = reducer(model, action, undefined as any)
        expect(out).toBeInstanceOf(Promise)
    })

    it('defines EXPORT_SIGNED_SPATIAL_RECEIPT action constant', () => {
        expect(Act.EXPORT_SIGNED_SPATIAL_RECEIPT).toBe(
            '[Menu action] Export Signed Spatial Receipt',
        )
    })
})
