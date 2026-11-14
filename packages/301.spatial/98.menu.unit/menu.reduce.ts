import clone from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

function cloneModel(model: MenuModel): MenuModel {
    return Object.assign(new MenuModel(), clone({ ...model }))
}

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_MENU:
            return Buzz.initMenu(cloneModel(model), act.bale, state)

        case Act.UPDATE_MENU:
            return Buzz.updateMenu(cloneModel(model), act.bale, state)

        case Act.EXECUTE_BOUNDARY_VERIFICATION:
            return Buzz.executeBoundaryVerification(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.RUN_ORACLE_RECIPROCITY_AUDIT:
            return Buzz.runOracleReciprocityAudit(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.TEST_WORK_BUDGET_TRIPWIRES:
            return Buzz.testWorkBudgetTripwires(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.RUN_BATCH_QUERY_AGGREGATOR:
            return Buzz.runBatchQueryAggregatorAudit(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.RUN_DIURNAL_SENSORY_PROBE:
            return Buzz.runDiurnalSensoryProbe(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.EXPORT_SIGNED_SPATIAL_RECEIPT:
            return Buzz.exportSignedSpatialReceiptMenuBuzz(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.RUN_EVENT_BLOCKING_PROBE:
            return Buzz.runEventBlockingProbe(
                cloneModel(model),
                act.bale,
                state,
            )

        case Act.PROBE_CHRONO_AGENDA:
            return Buzz.runChronoAgendaProbe(cloneModel(model), act.bale, state)

        default:
            return model
    }
}
