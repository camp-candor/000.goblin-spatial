import type { Action } from '../99.core/interface/action.interface.js'
import type CollectBit from './fce/collect.bit.js'

export const INIT_COLLECT = '[Collect action] Init Collect'
export class InitCollect implements Action<CollectBit> {
    readonly type = INIT_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const EXECUTE_BATCH = '[Collect action] Execute Batch'
export class ExecuteBatch implements Action<CollectBit> {
    readonly type = EXECUTE_BATCH
    constructor(public bale?: CollectBit) {}
}

// Legacy action bindings for monorepo bus and model interoperability
export const UPDATE_COLLECT = '[Collect action] Update Collect'
export class UpdateCollect implements Action<CollectBit> {
    readonly type = UPDATE_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const FETCH_COLLECT = '[Collect action] Fetch Collect'
export class FetchCollect implements Action<CollectBit> {
    readonly type = FETCH_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const READ_COLLECT = '[Read action] Read Collect'
export class ReadCollect implements Action<CollectBit> {
    readonly type = READ_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const WRITE_COLLECT = '[Write action] Write Collect'
export class WriteCollect implements Action<CollectBit> {
    readonly type = WRITE_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const CREATE_COLLECT = '[Create action] Create Collect'
export class CreateCollect implements Action<CollectBit> {
    readonly type = CREATE_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const REMOVE_COLLECT = '[Create action] Remove Collect'
export class RemoveCollect implements Action<CollectBit> {
    readonly type = REMOVE_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const DELETE_COLLECT = '[Create action] Delete Collect'
export class DeleteCollect implements Action<CollectBit> {
    readonly type = DELETE_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const EMPTY_COLLECT = '[Empty action] Empty Collect'
export class EmptyCollect implements Action<CollectBit> {
    readonly type = EMPTY_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const MODEL_COLLECT = '[Empty action] Model Collect'
export class ModelCollect implements Action<CollectBit> {
    readonly type = MODEL_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const PUT_COLLECT = '[Empty action] Put Collect'
export class PutCollect implements Action<CollectBit> {
    readonly type = PUT_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const GET_COLLECT = '[Empty action] Get Collect'
export class GetCollect implements Action<CollectBit> {
    readonly type = GET_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const FORMAT_COLLECT = '[Format action] Format Collect'
export class FormatCollect implements Action<CollectBit> {
    readonly type = FORMAT_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const DOT_COLLECT = '[Format action] Dot Collect'
export class DotCollect implements Action<CollectBit> {
    readonly type = DOT_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const LIST_COLLECT = '[List action] List Collect'
export class ListCollect implements Action<CollectBit> {
    readonly type = LIST_COLLECT
    constructor(public bale?: CollectBit) {}
}

export const HASH_COLLECT = '[Hash action] Hash Collect'
export class HashCollect implements Action<CollectBit> {
    readonly type = HASH_COLLECT
    constructor(public bale?: CollectBit) {}
}

export type Actions =
    | InitCollect
    | ExecuteBatch
    | UpdateCollect
    | FetchCollect
    | ReadCollect
    | WriteCollect
    | CreateCollect
    | RemoveCollect
    | DeleteCollect
    | EmptyCollect
    | ModelCollect
    | PutCollect
    | GetCollect
    | FormatCollect
    | DotCollect
    | ListCollect
    | HashCollect
