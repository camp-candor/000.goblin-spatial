import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import { exportScheduledAgendaSpatialProofs } from '../42.receipt.unit/buz/spatialDispatch.buzz.js'
import type { ScheduledSpatialAppointment } from '../05.clock.unit/fce/clock.interface.js'

function makeAppointment(
    beatId: string,
    isoDate: string,
    startTimeHm: string,
): ScheduledSpatialAppointment {
    return {
        beatId,
        title: `Title ${beatId}`,
        isoDate,
        startTimeHm,
        beatCategory: 'tribunal',
        locationId: 'BRASS_WORKSHOP',
        reserveCooldownTicks: 2,
    }
}

const topology = {
    topologyId: 'BRASS_WORKSHOP',
    nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
}

const actors = [
    { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
    { actorId: 'BOB', coord: createAxialCoord(1, 0) },
]

describe('Spatial Agenda Dispatch Suite', () => {
    const roots: string[] = []
    afterEach(() => {
        for (const r of roots.splice(0)) {
            if (fs.existsSync(r)) fs.rmSync(r, { recursive: true, force: true })
        }
        delete (globalThis as Record<string, unknown>).LIBRARY
    })
    function tmpDir(): string {
        const base = fs.mkdtempSync(path.join(os.tmpdir(), 'spatial-agenda-'))
        roots.push(base)
        return path.join(base, 'proofs')
    }

    it('orders proofs chronologically with stable digest', () => {
        const outA = tmpDir()
        const appointments = [
            makeAppointment('beat-003', '2026-10-31', '23:30'),
            makeAppointment('beat-001', '2026-10-30', '14:00'),
            makeAppointment('beat-002', '2026-10-31', '14:00'),
        ]
        const first = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            appointments,
            outA,
        )
        expect(first.proofCount).toBe(3)
        expect(first.proofBatchSha256).toMatch(/^[a-f0-9]{64}$/)
        const raw = fs.readFileSync(
            path.join(outA, 'agenda-spatial-proofs.json'),
            'utf-8',
        )
        expect(raw.endsWith('\n')).toBe(true)
        expect(raw.includes('\r')).toBe(false)
        const parsed = JSON.parse(raw) as {
            proofs: Array<{ beatId: string }>
        }
        expect(parsed.proofs.map((p) => p.beatId)).toEqual([
            'beat-001',
            'beat-002',
            'beat-003',
        ])
        const outB = tmpDir()
        const second = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            [...appointments].reverse(),
            outB,
        )
        expect(second.proofBatchSha256).toBe(first.proofBatchSha256)
    })

    it('handles empty agenda deterministically', () => {
        const out = tmpDir()
        const summary = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            [],
            out,
        )
        expect(summary.proofCount).toBe(0)
        expect(summary.proofBatchSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(
            fs.existsSync(path.join(out, 'agenda-spatial-proofs.json')),
        ).toBe(true)
    })

    it('rejects traversal escapes and emits ascii telemetry', () => {
        expect(() =>
            exportScheduledAgendaSpatialProofs(topology, actors, [], '../evil'),
        ).toThrow('UNSAFE_SPATIAL_BATCH_DIR')
        const captured: string[] = []
        ;(globalThis as Record<string, unknown>).LIBRARY = {
            hunt: async (action: string, payload: { src?: string }) => {
                if (
                    action === '[Console action] Update Console' &&
                    payload?.src !== undefined
                ) {
                    captured.push(String(payload.src))
                }
                return {}
            },
        }
        const out = tmpDir()
        exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            [makeAppointment('beat-001', '2026-10-31', '14:00')],
            out,
            { hunt: async () => ({}) } as never,
        )
        const raw = fs.readFileSync(
            path.join(out, 'agenda-spatial-proofs.json'),
            'utf-8',
        )
        expect(raw).toMatch(/^[\x20-\x7E\s]*$/)
        expect(
            captured.some((l) => l.startsWith('>> [SPATIAL:AGENDA_PROOF]')),
        ).toBe(true)
    })

    it('re-exports identical SHA-256 after file deletion for 23:30, 06:00, 14:00', () => {
        const out = tmpDir()
        const shuffled = [
            makeAppointment('beat-night', '2026-10-31', '23:30'),
            makeAppointment('beat-dawn', '2026-10-31', '06:00'),
            makeAppointment('beat-day', '2026-10-31', '14:00'),
        ]
        const first = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            shuffled,
            out,
        )
        const filePath = path.join(out, 'agenda-spatial-proofs.json')
        const raw = fs.readFileSync(filePath, 'utf-8')
        expect(raw.includes('\r\n')).toBe(false)
        const parsed = JSON.parse(raw) as {
            proofs: Array<{ startTimeHm: string }>
        }
        expect(parsed.proofs.map((p) => p.startTimeHm)).toEqual([
            '06:00',
            '14:00',
            '23:30',
        ])
        fs.unlinkSync(filePath)
        const second = exportScheduledAgendaSpatialProofs(
            topology,
            actors,
            shuffled,
            out,
        )
        expect(second.proofBatchSha256).toBe(first.proofBatchSha256)
    })
})
