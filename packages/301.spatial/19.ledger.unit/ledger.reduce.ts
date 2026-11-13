import clone from 'clone-deep'
import * as Act from './ledger.action.js'
import { LedgerModel } from './ledger.model.js'
import * as Buzz from './ledger.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LedgerModel = new LedgerModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_LEDGER:
            return Buzz.initLedger(clone(model), act.bale, state)

        case Act.APPEND_ENTRY:
            return Buzz.appendEntry(clone(model), act.bale, state)

        case Act.VERIFY_LINEAGE:
            return Buzz.verifyLineage(clone(model), act.bale, state)

        default:
            return model
    }
}
