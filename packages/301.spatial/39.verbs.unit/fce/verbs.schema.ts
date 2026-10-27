import { z } from 'zod'

export const KineticVerbEnum = z.enum([
    'SPRINT',
    'VAULT',
    'LEAP',
    'BIMANUAL_LIFT',
    'STRANGLE',
    'SCUTTLE',
    'LIMP',
    'SLITHER',
    'CRAWL',
    'POUR_OUT',
    'SNIFF',
    'CLIMB',
    'TWO_HANDED_AIM',
    'BIMANUAL_BRACE',
])

export type KineticVerb = z.infer<typeof KineticVerbEnum>

export const VERB_FAMILIES = {
    BIMANUAL: [
        'BIMANUAL_LIFT',
        'STRANGLE',
        'CLIMB',
        'TWO_HANDED_AIM',
        'BIMANUAL_BRACE',
    ] as const,
    HIGH_MOBILITY: ['SPRINT', 'VAULT', 'LEAP'] as const,
    LOCOMOTION: [
        'SPRINT',
        'VAULT',
        'LEAP',
        'SCUTTLE',
        'LIMP',
        'SLITHER',
        'CRAWL',
    ] as const,
    MANIPULATION: [
        'BIMANUAL_LIFT',
        'STRANGLE',
        'CLIMB',
        'TWO_HANDED_AIM',
        'BIMANUAL_BRACE',
        'POUR_OUT',
    ] as const,
    SENSORY: ['SNIFF'] as const,
} as const
