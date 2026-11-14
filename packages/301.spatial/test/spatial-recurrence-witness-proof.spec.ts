import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createAxialCoord } from '../28.axial.unit/val/axial.model.js'
import { computeSpatialLunarOptics } from '../05.clock.unit/buz/clock.buzz.js'
import { stageRecurringAppointmentSpatialProofs } from '../40.witness.unit/buz/witness.buzz.js'
import { exportRecurringAgendaSpatialReceipt } from '../42.receipt.unit/buz/spatialDispatch.buzz.js'

const topology = {
    topologyId: 'BRASS_WORKSHOP',
    nodes: { BRASS_WORKSHOP: { id: 'BRASS_WORKSHOP' } },
}

const actors = [
    { actorId: 'ALICE', coord: createAxialCoord(0, 1) },
    { actorId: 'BOB', coord: createAxialCoord(1, 0) },
]

function findPhaseDate(phase: string, timeHm: string): string {
    for (let i = 0; i < 60; i++) {
        const base = Date.UTC(2026, 9, 1) + i * 86400000
        const d = new Date(base)
        const iso =
            String(d.getUTCFullYear()).padStart(4, '0') +
            '-' +
            String(d.getUTCMonth() + 1).padStart(2, '0') +
            '-' +
            String(d.getUTCDate()).padStart(2, '0')
        if (computeSpatialLunarOptics(iso, timeHm).lunarPhase === phase) {
            return iso
        }
    }
    throw new Error('no phase date for ' + phase)
}

describe('Spatial Recurrence Witness Proof Suite', () => {
    it('stages per-occurrence proofs with lunar optics', () => {
        const result = stageRecurringAppointmentSpatialProofs(
            [
                {
                    beatId: 'beat-vigil',
                    title: 'Night Vigil',
                    isoDate: '2026-10-26',
                    startTimeHm: '23:30',
                    beatCategory: 'vigil',
                    locationId: 'BRASS_WORKSHOP',
                    reserveCooldownTicks: 1,
                    recurrenceRule: {
                        recurrenceKind: 'DAILY',
                        blackoutPolicy: 'SKIP',
                    },
                },
            ],
            topology,
            actors,
            { startIsoDate: '2026-10-26', horizonDays: 2 },
        )
        expect(result.expandedProofs.length).toBe(2)
        for (const p of result.expandedProofs) {
            const proof = p as {
                occurrenceKey: string
                weekday: string
                lunarPhase: string
                lunarIlluminationBps: number
                effectiveOpticalRangeBps: number
                reachableWitnessIds: readonly string[]
            }
            expect(proof.occurrenceKey).toMatch(
                /^beat-vigil@\d{4}-\d{2}-\d{2}$/,
            )
            expect(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).toContain(
                proof.weekday,
            )
            expect(Number.isInteger(proof.lunarIlluminationBps)).toBe(true)
            expect(proof.effectiveOpticalRangeBps).toBeGreaterThanOrEqual(0)
            expect(proof.effectiveOpticalRangeBps).toBeLessThanOrEqual(10000)
        }
    })

    it('admits borderline witnesses on FULL_MOON versus NEW_MOON', () => {
        const fullIso = findPhaseDate('FULL_MOON', '23:30')
        const newIso = findPhaseDate('NEW_MOON', '23:30')
        const mk = (iso: string, beat: string) => ({
            beatId: beat,
            title: 'Vigil',
            isoDate: iso,
            startTimeHm: '23:30',
            beatCategory: 'vigil',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 0,
            recurrenceRule: {
                recurrenceKind: 'ONCE' as const,
                blackoutPolicy: 'SKIP' as const,
            },
        })
        const full = stageRecurringAppointmentSpatialProofs(
            [mk(fullIso, 'beat-full')],
            topology,
            actors,
            { startIsoDate: fullIso, horizonDays: 1 },
        )
        const nightly = stageRecurringAppointmentSpatialProofs(
            [mk(newIso, 'beat-new')],
            topology,
            actors,
            { startIsoDate: newIso, horizonDays: 1 },
        )
        const fullProof = full.expandedProofs[0] as {
            effectiveOpticalRangeBps: number
            reachableWitnessIds: readonly string[]
            lunarPhase: string
        }
        const newProof = nightly.expandedProofs[0] as {
            effectiveOpticalRangeBps: number
            reachableWitnessIds: readonly string[]
            lunarPhase: string
        }
        expect(fullProof.lunarPhase).toBe('FULL_MOON')
        expect(newProof.lunarPhase).toBe('NEW_MOON')
        expect(fullProof.effectiveOpticalRangeBps).toBeGreaterThan(
            newProof.effectiveOpticalRangeBps,
        )
        expect(fullProof.reachableWitnessIds.length).toBeGreaterThan(
            newProof.reachableWitnessIds.length,
        )
    })

    it('records blackouts and rejects unknown venue', () => {
        const result = stageRecurringAppointmentSpatialProofs(
            [
                {
                    beatId: 'beat-holiday',
                    title: 'Market Day',
                    isoDate: '2026-10-26',
                    startTimeHm: '14:00',
                    beatCategory: 'market',
                    locationId: 'BRASS_WORKSHOP',
                    reserveCooldownTicks: 0,
                    recurrenceRule: {
                        recurrenceKind: 'DAILY',
                        blackoutPolicy: 'SKIP',
                    },
                },
            ],
            topology,
            actors,
            {
                startIsoDate: '2026-10-26',
                horizonDays: 3,
                seriesBlackouts: ['2026-10-27'],
            },
        )
        expect(result.blackoutSkips.length).toBe(1)
        expect(result.expandedProofs.length).toBe(2)
        expect(() =>
            stageRecurringAppointmentSpatialProofs(
                [
                    {
                        beatId: 'beat-void',
                        title: 'Void',
                        isoDate: '2026-10-26',
                        startTimeHm: '14:00',
                        beatCategory: 'void',
                        locationId: 'VOID_VAULT',
                        reserveCooldownTicks: 0,
                    },
                ],
                topology,
                actors,
                { startIsoDate: '2026-10-26', horizonDays: 1 },
            ),
        ).toThrow('UNKNOWN_APPOINTMENT_LOCATION')
    })

    it('seals deterministic digest across permuted inputs', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recur-'))
        const a = {
            beatId: 'beat-a',
            title: 'A',
            isoDate: '2026-10-26',
            startTimeHm: '23:30',
            beatCategory: 'vigil',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 0,
            recurrenceRule: {
                recurrenceKind: 'DAILY' as const,
                blackoutPolicy: 'SKIP' as const,
            },
        }
        const b = {
            beatId: 'beat-b',
            title: 'B',
            isoDate: '2026-10-26',
            startTimeHm: '14:00',
            beatCategory: 'market',
            locationId: 'BRASS_WORKSHOP',
            reserveCooldownTicks: 0,
            recurrenceRule: {
                recurrenceKind: 'DAILY' as const,
                blackoutPolicy: 'SKIP' as const,
            },
        }
        const first = exportRecurringAgendaSpatialReceipt({
            appointments: [a, b],
            topology,
            actors,
            startIsoDate: '2026-10-26',
            horizonDays: 2,
            outputDir: dir,
        })
        const secondDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recur-'))
        const second = exportRecurringAgendaSpatialReceipt({
            appointments: [b, a],
            topology,
            actors,
            startIsoDate: '2026-10-26',
            horizonDays: 2,
            outputDir: secondDir,
        })
        expect(first.recurrenceExpansionDigest).toBe(
            second.recurrenceExpansionDigest,
        )
        expect(first.recurrenceExpansionDigest).toMatch(/^[a-f0-9]{64}$/)
        const payload = JSON.parse(
            fs.readFileSync(
                path.join(dir, 'agenda-spatial-proofs.json'),
                'utf-8',
            ),
        )
        expect(payload.expandedProofs.length).toBe(4)
        expect(payload.recurrenceExpansionDigest).toBe(
            first.recurrenceExpansionDigest,
        )
        fs.rmSync(dir, { recursive: true, force: true })
        fs.rmSync(secondDir, { recursive: true, force: true })
    })
})
