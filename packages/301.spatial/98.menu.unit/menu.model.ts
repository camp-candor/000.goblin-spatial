import type Menu from './fce/menu.interface.js'
import type { MenuMode } from './fce/menu.interface.js'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    activeMenuMode: MenuMode = 'ROOT'
    lastActionTimestamp: number = 0
    totalInteractions: number = 0
    statusMessage: string = 'SPATIAL_ORACLE_READY'
    lastAuditSummary: string | null = null
}

export default MenuModel
