import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import {
    exportScheduledAgendaSpatialProofs,
    verifySpatialAgendaReplayEquivalence,
} from '../42.receipt.unit/buz/spatialDispatch.buzz.js'
import type { ScheduledSpatialAppointment } from '../05.clock.unit/fce/clock.interface.js'

function makeAppointment(
    beatId: string,
    startTimeHm: string,
): ScheduledSpatialAppointment {
    return {
        beatId,
        title: `Title ${beatId}`,
        isoDate: '2026-10-31',
        startTimeHm,
        beatCategory: 'tribunal',
        locationId: 'BRASS_WORKSHOP',
        reserveCooldownTicks: 1,
    }
}

const topology = {
    topologyId: 'BRASS_WORKSHOP',
    nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
}

const actors = [{ actorId: 'ALICE', coord: createAxialCoord(0, 1) }]

describe('Spatial Agenda Replay Suite', () => {
    const roots: string[] = []
    afterEach(() => {
        for (const r of roots.splice(0)) {
            if (fs.existsSync(r)) fs.rmSync(r, { recursive: true, force: true })
        }
        delete (globalThis as Record<string, unknown>).LIBRARY
    })
    function tmpDir(): string {
        const base = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-replay-'))
        roots.push(base)
        return path.join(base, 'proofs')
    }

    it('certifies wipe-reset sha equality', () => {
        const out = tmpDir()
        const appointments = [
            makeAppointment('beat-001', '14:00'),
            makeAppointment('beat-002', '23:30'),
        ]
        const result = verifySpatialAgendaReplayEquivalence(
            topology,
            actors,
            appointments,
            out,
        )
        expect(result.deterministic).toBe(true)
        expect(result.mismatches).toBe(0)
        expect(result.proofCount).toBe(2)
        expect(result.proofBatchSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(
            fs.existsSync(path.join(out, 'agenda-spatial-proofs.json')),
        ).toBe(true)
    })

    it('isolates cross-daypart optical bounds regardless of order', () => {
        const outA = tmpDir()
        const outB = tmpDir()
        const nightFirst = [
            makeAppointment('beat-night', '23:30'),
            makeAppointment('beat-day', '14:00'),
        ]
        const dayFirst = [...nightFirst].reverse()
        const sumA = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            nightFirst,
            outA,
        )
        const sumB = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            dayFirst,
            outB,
        )
        expect(sumA.proofBatchSha256).toBe(sumB.proofBatchSha256)
        const rawA = JSON.parse(
            fs.readFileSync(
                path.join(outA, 'agenda-spatial-proofs.json'),
                'utf-8',
            ),
        ) as { proofs: Array<{ beatId: string; daypart: string }> }
        expect(rawA.proofs[0].beatId).toBe('beat-day')
        expect(rawA.proofs[0].daypart).toBe('AFTERNOON')
        expect(rawA.proofs[1].daypart).toBe('NIGHT')
    })

    it('verifies 4-beat DAWN->AFTERNOON->DUSK->NIGHT wipe-replay equivalence and reverse invariance', () => {
        const out = tmpDir()
        const fourBeats = [
            makeAppointment('beat-01-dawn', '05:45'),
            makeAppointment('beat-02-afternoon', '14:00'),
            makeAppointment('beat-03-dusk', '18:00'),
            makeAppointment('beat-04-night', '23:30'),
        ]
        const forward = verifySpatialAgendaReplayEquivalence(
            topology,
            actors,
            fourBeats,
            out,
        )
        expect(forward.deterministic).toBe(true)
        expect(forward.mismatches).toBe(0)
        expect(forward.proofCount).toBe(4)

        const outRev = tmpDir()
        const reversed = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            [...fourBeats].reverse(),
            outRev,
        )
        expect(reversed.proofBatchSha256).toBe(forward.proofBatchSha256)
    })
})
