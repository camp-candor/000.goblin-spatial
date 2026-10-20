import { Action } from '../99.core/interface/action.interface'
import GeojsonBit from './fce/geojson.bit'

export const INIT_GEOJSON = '[Geojson action] Init Geojson'
export class InitGeojson implements Action {
    readonly type = INIT_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export const UPDATE_GEOJSON = '[Geojson action] Update Geojson'
export class UpdateGeojson implements Action {
    readonly type = UPDATE_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export const LOAD_GEOJSON = '[Load action] Load Geojson'
export class LoadGeojson implements Action {
    readonly type = LOAD_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export const INDEX_GEOJSON = '[Index action] Index Geojson'
export class IndexGeojson implements Action {
    readonly type = INDEX_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export const CAPTURE_GEOJSON = '[Capture action] Capture Geojson'
export class CaptureGeojson implements Action {
    readonly type = CAPTURE_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export const SAVE_GEOJSON = '[Save action] Save Geojson'
export class SaveGeojson implements Action {
    readonly type = SAVE_GEOJSON
    constructor(public bale: GeojsonBit) {}
}

export type Actions =
    | InitGeojson
    | UpdateGeojson
    | LoadGeojson
    | IndexGeojson
    | CaptureGeojson
    | SaveGeojson
