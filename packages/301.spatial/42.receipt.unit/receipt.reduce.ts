import clone from 'clone-deep'
import * as Act from './receipt.action'
import { ReceiptModel } from './receipt.model'
import * as Buzz from './receipt.buzzer'
import State from '../99.core/state'

export function reducer(
    model: ReceiptModel = new ReceiptModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_RECEIPT:
            return Buzz.updateReceipt(clone(model), act.bale, state)

        case Act.INIT_RECEIPT:
            return Buzz.initReceipt(clone(model), act.bale, state)

        default:
            return model
    }
}
