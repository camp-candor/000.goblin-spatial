import type Clock from './fce/clock.interface.js'
import type {
    DiurnalAttenuationProfile,
    SpatialClockSnapshot,
} from './fce/clock.interface.js'

export class ClockModel implements Clock {
    activeSnapshot: SpatialClockSnapshot | null = null
    activeDiurnalProfile: DiurnalAttenuationProfile | null = null
}
