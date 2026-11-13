import clone from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_MENU:
            return Buzz.initMenu(clone(model), act.bale, state)

        case Act.UPDATE_MENU:
            return Buzz.updateMenu(clone(model), act.bale, state)

        case Act.EXECUTE_BOUNDARY_VERIFICATION:
            return Buzz.executeBoundaryVerification(
                clone(model),
                act.bale,
                state,
            )

        case Act.RUN_ORACLE_RECIPROCITY_AUDIT:
            return Buzz.runOracleReciprocityAudit(clone(model), act.bale, state)

        case Act.TEST_WORK_BUDGET_TRIPWIRES:
            return Buzz.testWorkBudgetTripwires(clone(model), act.bale, state)

        case Act.RUN_BATCH_QUERY_AGGREGATOR:
            return Buzz.runBatchQueryAggregatorAudit(
                clone(model),
                act.bale,
                state,
            )

        case Act.EXPORT_SIGNED_SPATIAL_RECEIPT:
            return Buzz.exportSignedSpatialReceiptMenuBuzz(
                clone(model),
                act.bale,
                state,
            )

        default:
            return model
    }
}
