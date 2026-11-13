import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { MenuModel } from '../menu.model.js'
import { SPATIAL_MENU_CHOICES } from '../val/menu.model.js'
import {
    exportSignedSpatialReceiptMenuBuzz,
    EXPORT_RECEIPT_MENU_LABEL,
} from '../buz/00.menu.buzz.js'
import * as Act from '../menu.action.js'
import { reducer } from '../menu.reduce.js'
import type MenuBit from '../fce/menu.bit.js'

describe('98.menu.unit - Spatial Export Menu Trigger & Topology Ingestion [Task 1.3.2]', () => {
    let tempDir: string | null = null

    afterEach(() => {
        if (tempDir && fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true })
            tempDir = null
        }
        delete (globalThis as any).INGESTED_TOPOLOGY_MANIFESTS
        delete (globalThis as any).ACTIVE_TOPOLOGY_MANIFEST
    })

    it('exports EXPORT_RECEIPT_MENU_LABEL constant and includes it in SPATIAL_MENU_CHOICES', () => {
        expect(EXPORT_RECEIPT_MENU_LABEL).toBe(
            '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE',
        )
        expect(SPATIAL_MENU_CHOICES).toContain(EXPORT_RECEIPT_MENU_LABEL)
    })

    it('dispatches spatial export command, packages optical/acoustic proofs, and resolves success', async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-menu-export-'))
        const model = new MenuModel()
        let resolved: any = null
        const bale: MenuBit = {
            idx: 'export-spatial-receipt',
            dat: {
                targetEngineRoot: tempDir,
            },
            slv: (res) => {
                resolved = res
            },
        }

        const result = await exportSignedSpatialReceiptMenuBuzz(model, bale)

        expect(result.statusMessage).toBe('SPATIAL_RECEIPT_EXPORTED')
        expect(resolved).not.toBeNull()
        expect(resolved.mnuBit.idx).toBe('export-spatial-receipt-success')
        expect(resolved.mnuBit.val).toBe(1)
        expect(resolved.mnuBit.dat?.opticalProof?.evidence?.modality).toBe(
            'OPTICAL',
        )
        expect(resolved.mnuBit.dat?.acousticProof?.evidence?.modality).toBe(
            'ACOUSTIC',
        )
    })

    it('routes EXPORT_SIGNED_SPATIAL_RECEIPT action through reducer', () => {
        const model = new MenuModel()
        const action = new Act.ExportSignedSpatialReceipt()
        const out = reducer(model, action, undefined as any)
        expect(out).toBeInstanceOf(Promise)
    })

    it('defines EXPORT_SIGNED_SPATIAL_RECEIPT action constant', () => {
        expect(Act.EXPORT_SIGNED_SPATIAL_RECEIPT).toBe(
            '[Menu action] Export Signed Spatial Receipt',
        )
    })

    it('[Task 1.3.2] parses newly transferred static topology graphs upon terminal boot', async () => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-ingest-'))
        const manifestsDir = path.join(tempDir, 'manifests')
        fs.mkdirSync(manifestsDir, { recursive: true })

        const gothamTopology = {
            schema_version: '1.0.0',
            series_slug: 'gotham-trinity-crisis',
            merkle_root: 'ab'.repeat(32),
            nodes: {
                loc_gotham_rooftop: {
                    locationId: 'loc_gotham_rooftop',
                    displayName: 'Gotham Rooftop',
                    adjacentLocations: ['loc_chemical_plant'],
                    acousticDampingFactor: 2200,
                },
                loc_chemical_plant: {
                    locationId: 'loc_chemical_plant',
                    displayName: 'Ace Chemical Plant',
                    adjacentLocations: ['loc_gotham_rooftop'],
                    acousticDampingFactor: 1800,
                },
            },
        }

        fs.writeFileSync(
            path.join(manifestsDir, 'gotham-trinity-crisis-topology.json'),
            JSON.stringify(gothamTopology, null, 2),
            'utf8',
        )

        const logs: string[] = []
        const runnerSpec = [
            '..',
            '..',
            '..',
            '..',
            'apps',
            '995.library',
            'run.ts',
        ].join('/')
        const { ingestTransferredTopologyGraphs } = (await import(
            runnerSpec
        )) as any
        const ingested = await ingestTransferredTopologyGraphs({
            repoRoot: tempDir,
            enabled: true,
            onTelemetry: (line: string) => {
                logs.push(line)
            },
        })

        expect(ingested).toHaveLength(1)
        expect(ingested[0].seriesSlug).toBe('gotham-trinity-crisis')
        expect(ingested[0].nodeCount).toBe(2)
        expect((globalThis as any).ACTIVE_TOPOLOGY_MANIFEST?.series_slug).toBe(
            'gotham-trinity-crisis',
        )
        expect(
            logs.some((l) =>
                l.includes(
                    ">> [SPATIAL:INGEST] [OK] Parsed static topology 'gotham-trinity-crisis' (2 node(s)",
                ),
            ),
        ).toBe(true)
    })
})
