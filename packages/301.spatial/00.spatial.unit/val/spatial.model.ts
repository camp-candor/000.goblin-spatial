import { z } from 'zod'

export const DEFAULT_KERNEL_VERSION = 'v1.0.0-spatial-oracle'

export const SpatialPortConfigSchema = z
    .object({
        kernelVersion: z.string().min(1).default('v1.0.0-spatial-oracle'),
        defaultWorkEnvelopeLimit: z
            .number()
            .int()
            .positive()
            .max(2048)
            .default(512),
        enforceAuditLogging: z.boolean().default(true),
    })
    .strict()

export type SpatialPortConfig = z.infer<typeof SpatialPortConfigSchema>
