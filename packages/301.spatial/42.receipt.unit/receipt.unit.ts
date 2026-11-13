import type { Unit } from '../99.core/interface/unit.interface.js'
import { ReceiptModel } from './receipt.model.js'
import { reducer } from './receipt.reduce.js'

export default class ReceiptUnit implements Unit<ReceiptModel> {
    idx: string = '42.receipt'
    model: ReceiptModel = new ReceiptModel()
    reducer = reducer
}
