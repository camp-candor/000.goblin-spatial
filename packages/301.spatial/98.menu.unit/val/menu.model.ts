import { z } from 'zod'

export const SPATIAL_MENU_CHOICES = Object.freeze([
    '[01] LOAD CANONICAL TOPOLOGY MANIFEST',
    '[02] RUN SYNCHRONOUS PORT PROBE',
    '[03] EXECUTE 8,190-PAIR OPTICAL RECIPROCITY AUDIT',
    '[04] TEST WORK BUDGET TRIPWIRES',
    '[05] RUN BATCH QUERY AGGREGATOR',
    '[06] RUN DIURNAL SENSORY CLOCK PROBE',
    '[07] RUN SPATIAL EVENT WITNESS BLOCKING PROBE',
    '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE',
    '[ROOT MENU]',
])

export const MenuModelConfigSchema = z
    .object({
        activeMenuMode: z
            .enum([
                'ROOT',
                'BOUNDARY_AUDIT',
                'TOPOLOGY_INSPECTION',
                'DIURNAL_AUDIT',
                'EVENT_BLOCKING',
            ])
            .default('ROOT'),
        statusMessage: z.string().default('SPATIAL_ORACLE_READY'),
    })
    .strict()

export type MenuModelConfig = z.infer<typeof MenuModelConfigSchema>
