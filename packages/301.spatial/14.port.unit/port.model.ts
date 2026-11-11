import type Port from './fce/port.interface.js'

export class PortModel implements Port {
    idx: string = '14.port'
    kernelVersion: string = 'v1.0.0-spatial-oracle'
    totalQueriesProcessed: number = 0
    totalBudgetsTripped: number = 0
    lastExecutionMicros: number = 0
}

export default PortModel
