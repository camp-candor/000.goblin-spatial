import type { Action } from '../99.core/interface/action.interface.js'
import type MenuBit from './fce/menu.bit.js'

export const INIT_MENU = '[Menu action] Init Menu'
export class InitMenu implements Action<MenuBit> {
    readonly type = INIT_MENU
    constructor(public bale?: MenuBit) {}
}

export const UPDATE_MENU = '[Menu action] Update Menu'
export class UpdateMenu implements Action<MenuBit> {
    readonly type = UPDATE_MENU
    constructor(public bale?: MenuBit) {}
}

export const EXECUTE_BOUNDARY_VERIFICATION =
    '[Menu action] Execute Boundary Verification'
export class ExecuteBoundaryVerification implements Action<MenuBit> {
    readonly type = EXECUTE_BOUNDARY_VERIFICATION
    constructor(public bale?: MenuBit) {}
}

export const RUN_ORACLE_RECIPROCITY_AUDIT =
    '[Menu action] Run Oracle Reciprocity Audit'
export class RunOracleReciprocityAudit implements Action<MenuBit> {
    readonly type = RUN_ORACLE_RECIPROCITY_AUDIT
    constructor(public bale?: MenuBit) {}
}

export const TEST_WORK_BUDGET_TRIPWIRES =
    '[Menu action] Test Work Budget Tripwires'
export class TestWorkBudgetTripwires implements Action<MenuBit> {
    readonly type = TEST_WORK_BUDGET_TRIPWIRES
    constructor(public bale?: MenuBit) {}
}

export const RUN_BATCH_QUERY_AGGREGATOR =
    '[Menu action] Run Batch Query Aggregator'
export class RunBatchQueryAggregator implements Action<MenuBit> {
    readonly type = RUN_BATCH_QUERY_AGGREGATOR
    constructor(public bale?: MenuBit) {}
}

export const RUN_DIURNAL_SENSORY_PROBE =
    '[Menu action] Run Diurnal Sensory Probe'
export class RunDiurnalSensoryProbe implements Action<MenuBit> {
    readonly type = RUN_DIURNAL_SENSORY_PROBE
    constructor(public bale?: MenuBit) {}
}

export const EXPORT_SIGNED_SPATIAL_RECEIPT =
    '[Menu action] Export Signed Spatial Receipt'
export class ExportSignedSpatialReceipt implements Action<MenuBit> {
    readonly type = EXPORT_SIGNED_SPATIAL_RECEIPT
    constructor(public bale?: MenuBit) {}
}

export const RUN_EVENT_BLOCKING_PROBE = '[Menu action] Run Event Blocking Probe'
export class RunEventBlockingProbe implements Action<MenuBit> {
    readonly type = RUN_EVENT_BLOCKING_PROBE
    constructor(public bale?: MenuBit) {}
}

export const PROBE_CHRONO_AGENDA = '[Menu action] Probe Chrono Agenda'
export class ProbeChronoAgenda implements Action<MenuBit> {
    readonly type = PROBE_CHRONO_AGENDA
    constructor(public bale?: MenuBit) {}
}

export const PROBE_RECURRENCE_CALENDAR =
    '[Menu action] Probe Recurrence Calendar'
export class ProbeRecurrenceCalendar implements Action<MenuBit> {
    readonly type = PROBE_RECURRENCE_CALENDAR
    constructor(public bale?: MenuBit) {}
}

export type Actions =
    | InitMenu
    | UpdateMenu
    | ExecuteBoundaryVerification
    | RunOracleReciprocityAudit
    | TestWorkBudgetTripwires
    | RunBatchQueryAggregator
    | RunDiurnalSensoryProbe
    | ExportSignedSpatialReceipt
    | RunEventBlockingProbe
    | ProbeChronoAgenda
    | ProbeRecurrenceCalendar
