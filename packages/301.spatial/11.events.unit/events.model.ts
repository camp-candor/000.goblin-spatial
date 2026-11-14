import Events from './fce/events.interface.js'

export class EventsModel implements Events {
    spatialEventReceipts: unknown[] = []
    totalSpatialEvents: number = 0
}
