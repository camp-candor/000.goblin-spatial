import clone from 'clone-deep'
import * as Act from './spatial.action.js'
import { SpatialModel } from './spatial.model.js'
import * as Buzz from './spatial.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: SpatialModel = new SpatialModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_SPATIAL:
            return Buzz.initSpatial(clone(model), act.bale, state)

        case Act.INVOKE_SYNCHRONOUS: {
            const port = Buzz.createInProcessSpatialPort()
            const rawQuery = act.bale?.dat?.rawQuery
            const context = act.bale?.dat?.context
            const receipt = port.invokeSynchronous(rawQuery, context)

            const next = clone(model)
            next.totalSynchronousInvocations += 1
            next.lastExecutionMicros = receipt.executionMicros
            if (receipt.failureCode === 'BUDGET_EXCEEDED') {
                next.totalBudgetsTripped += 1
            }

            if (act.bale?.slv) {
                act.bale.slv({
                    sptBit: {
                        idx: receipt.ok ? 'invoke-success' : 'invoke-failure',
                        val: receipt.ok ? 1 : 0,
                        dat: { receipt },
                    },
                })
            }
            return next
        }

        case Act.UPDATE_SPATIAL:
            if (act.bale?.slv) {
                act.bale.slv({
                    sptBit: {
                        idx: 'update-spatial-success',
                        val: 1,
                    },
                })
            }
            return model

        default:
            return model
    }
}
