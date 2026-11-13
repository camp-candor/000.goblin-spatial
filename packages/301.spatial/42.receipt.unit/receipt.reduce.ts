import clone from 'clone-deep'
import * as Act from './receipt.action.js'
import { ReceiptModel } from './receipt.model.js'
import * as Buzz from './receipt.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: ReceiptModel = new ReceiptModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_RECEIPT:
            return Buzz.initReceipt(clone(model), act.bale, state)

        case Act.MINT_PATH_RECEIPT:
            return Buzz.mintPathReceipt(clone(model), act.bale, state)

        case Act.MINT_PERCEPT_RECEIPT:
            return Buzz.mintPerceptReceipt(clone(model), act.bale, state)

        case Act.MINT_DISPLACEMENT_RECEIPT:
            return Buzz.mintDisplacementReceipt(clone(model), act.bale, state)

        default:
            return model
    }
}
