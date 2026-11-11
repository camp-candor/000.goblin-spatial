import type Spatial from './fce/spatial.interface.js'

export class SpatialModel implements Spatial {
    idx: string = '00.spatial'
    kernelVersion: string = 'v1.0.0-spatial-oracle'
    totalSynchronousInvocations: number = 0
    totalBudgetsTripped: number = 0
    lastExecutionMicros: number = 0
}

export default SpatialModel
