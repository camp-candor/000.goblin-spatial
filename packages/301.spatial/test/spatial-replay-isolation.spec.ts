import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import {
    exportSpatialEventProofBatch,
    verifySpatialBatchReplayDeterminism,
} from '../42.receipt.unit/buz/spatialDispatch.buzz.js'
import { resetSpatialIncidentState } from '../23.incident.unit/buz/incident.buzz.js'
import type { SpatialBatchEventInput } from '../42.receipt.unit/fce/receipt.interface.js'

function makeEvents(startTime: string): SpatialBatchEventInput[] {
    return [
        {
            eventSequence: 1,
            tick: 3,
            startDate: '2026-10-31',
            startTime,
            originCoord: createAxialCoord(0, 0),
            actors: [{ actorId: 'ALICE', coord: createAxialCoord(0, 1) }],
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        },
        {
            eventSequence: 2,
            tick: 7,
            startDate: '2026-10-31',
            startTime,
            originCoord: createAxialCoord(1, 0),
            actors: [{ actorId: 'BOB', coord: createAxialCoord(1, 1) }],
            locationId: 'BRASS_WORKSHOP',
            locationName: 'Brass Workshop',
        },
    ]
}

describe('Spatial Replay Isolation Suite', () => {
    const roots: string[] = []
    afterEach(() => {
        for (const r of roots.splice(0)) {
            if (fs.existsSync(r)) fs.rmSync(r, { recursive: true, force: true })
        }
    })
    function tmpOut(): string {
        const base = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-replay-'))
        roots.push(base)
        return path.join(base, 'proofs')
    }

    it('certifies wipe plus restart parity', () => {
        const out = tmpOut()
        const result = verifySpatialBatchReplayDeterminism(
            makeEvents('14:00'),
            out,
        )
        expect(result.deterministic).toBe(true)
        expect(result.packetCount).toBe(2)
        expect(result.indexSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(result.mismatchedPackets).toEqual([])
        expect(
            fs.existsSync(path.join(out, 'spatial_event_0001_t0003.json')),
        ).toBe(true)
        expect(
            fs.existsSync(path.join(out, 'spatial_event_0002_t0007.json')),
        ).toBe(true)
    })

    it('flags divergence upon clock shift', () => {
        const outA = tmpOut()
        const outB = tmpOut()
        const sumDay = exportSpatialEventProofBatch(makeEvents('14:00'), {
            outputDir: outA,
        })
        const sumNight = exportSpatialEventProofBatch(makeEvents('21:00'), {
            outputDir: outB,
        })
        expect(sumDay.indexSha256).not.toBe(sumNight.indexSha256)
        const bytesDay = fs.readFileSync(
            path.join(outA, 'spatial_event_0001_t0003.json'),
            'utf-8',
        )
        const bytesNight = fs.readFileSync(
            path.join(outB, 'spatial_event_0001_t0003.json'),
            'utf-8',
        )
        expect(bytesDay).not.toBe(bytesNight)
    })

    it('clears transient state without touching topology', () => {
        const res = resetSpatialIncidentState({
            lastIncidentReport: { locationId: 'X' },
            incidentReceiptCount: 5,
        } as never)
        expect(res.cleared).toBe(true)
        expect(resetSpatialIncidentState()).toEqual({ cleared: true })
    })
})
