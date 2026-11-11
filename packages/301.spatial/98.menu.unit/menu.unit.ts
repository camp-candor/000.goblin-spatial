import type { Unit } from '../99.core/interface/unit.interface.js'
import { MenuModel } from './menu.model.js'
import { reducer } from './menu.reduce.js'

export default class MenuUnit implements Unit<MenuModel> {
    idx: string = '98.menu'
    model: MenuModel = new MenuModel()
    reducer = reducer
}
