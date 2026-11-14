import { z } from 'zod'
import EventsBit from './events.bit.js'
import { AxialCoordSchema } from '../../23.incident.unit/fce/incident.interface.js'

export default interface Events {
    spatialEventReceipts?: unknown[]
    totalSpatialEvents?: number
}

export const SpatialEventRecordSchema = z
    .object({
        locationId: z.string().min(1),
        originCoord: AxialCoordSchema,
        clockTimeHm: z.string().regex(/^\d{2}:\d{2}$/),
        visibleWitnessIds: z.array(z.string()),
        audibleWitnessIds: z.array(z.string()),
        witnessCount: z.number().int().min(0),
        sequence: z.number().int().min(0),
    })
    .strict()

export type SpatialEventRecord = z.infer<typeof SpatialEventRecordSchema>

export type { EventsBit }
