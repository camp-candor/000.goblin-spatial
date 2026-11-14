import { EventsModel } from '../events.model.js'
import EventsBit from '../fce/events.bit.js'
import State from '../../99.core/state.js'
import { evaluateSpatialIncidentWitnesses } from '../../23.incident.unit/buz/incident.buzz.js'
import { SpatialEventRecordSchema } from '../fce/events.interface.js'

export const initEvents = (
    cpy: EventsModel,
    bal?: EventsBit,
    _ste?: State,
): EventsModel => {
    cpy.spatialEventReceipts = []
    cpy.totalSpatialEvents = 0
    if (bal?.slv) {
        bal.slv({ evtBit: { idx: 'init-events-ok', val: 1 } })
    }
    return cpy
}

export const updateEvents = (
    cpy: EventsModel,
    bal?: EventsBit,
    _ste?: State,
): EventsModel => {
    if (bal?.slv) {
        bal.slv({ evtBit: { idx: 'update-events-ok', val: 1 } })
    }
    return cpy
}

export function recordSpatialEvent(
    cpy: EventsModel,
    bal?: EventsBit,
    _ste?: State,
): EventsModel {
    const dat = (bal?.dat ?? {}) as Record<string, unknown>
    try {
        const rawInput =
            (dat.incidentInput as Record<string, unknown>) ??
            (dat.witnessInput as Record<string, unknown>) ??
            (dat.eventInput as Record<string, unknown>) ??
            dat
        const providedReport = dat.incidentReport as
            | {
                  locationId: string
                  clockTimeHm: string
                  originCoord: { q: number; r: number; s: number }
                  visibleWitnessIds: string[]
                  audibleWitnessIds: string[]
                  witnesses: Array<{ actorId: string }>
              }
            | undefined
        let locationId = 'UNKNOWN'
        let clockTimeHm = '21:00'
        let originCoord = { q: 0, r: 0, s: 0 }
        let visibleWitnessIds: string[] = []
        let audibleWitnessIds: string[] = []
        let witnessCount = 0
        if (providedReport !== undefined && providedReport !== null) {
            locationId = String(providedReport.locationId ?? 'UNKNOWN')
            clockTimeHm = String(providedReport.clockTimeHm ?? '21:00')
            originCoord = {
                q: Number(providedReport.originCoord?.q ?? 0),
                r: Number(providedReport.originCoord?.r ?? 0),
                s: Number(
                    providedReport.originCoord?.s ??
                        -(
                            Number(providedReport.originCoord?.q ?? 0) +
                            Number(providedReport.originCoord?.r ?? 0)
                        ),
                ),
            }
            visibleWitnessIds = [
                ...(providedReport.visibleWitnessIds ?? []),
            ].sort((a, b) => a.localeCompare(b))
            audibleWitnessIds = [
                ...(providedReport.audibleWitnessIds ?? []),
            ].sort((a, b) => a.localeCompare(b))
            witnessCount = Array.isArray(providedReport.witnesses)
                ? providedReport.witnesses.length
                : 0
        } else {
            const report = evaluateSpatialIncidentWitnesses(rawInput as never)
            locationId = report.locationId
            clockTimeHm = report.clockTimeHm
            originCoord = {
                q: report.originCoord.q,
                r: report.originCoord.r,
                s: report.originCoord.s,
            }
            visibleWitnessIds = [...report.visibleWitnessIds].sort((a, b) =>
                a.localeCompare(b),
            )
            audibleWitnessIds = [...report.audibleWitnessIds].sort((a, b) =>
                a.localeCompare(b),
            )
            witnessCount = report.witnesses.length
        }
        const sequence = cpy.totalSpatialEvents ?? 0
        const record = SpatialEventRecordSchema.parse({
            locationId,
            originCoord,
            clockTimeHm,
            visibleWitnessIds,
            audibleWitnessIds,
            witnessCount,
            sequence,
        })
        cpy.spatialEventReceipts = [
            ...(cpy.spatialEventReceipts ?? []),
            Object.freeze({ ...record }),
        ]
        cpy.totalSpatialEvents = sequence + 1
        if (bal?.slv) {
            bal.slv({
                evtBit: {
                    idx: 'record-spatial-event-ok',
                    val: 1,
                    dat: { record },
                },
            })
        }
    } catch (err) {
        if (bal?.slv) {
            bal.slv({
                evtBit: {
                    idx: 'record-spatial-event-fail',
                    val: 0,
                    dat: {
                        error: err instanceof Error ? err.message : String(err),
                    },
                },
            })
        }
    }
    return cpy
}
