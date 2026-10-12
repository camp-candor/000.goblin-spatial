/* eslint-disable */
import { MenuModel } from '../menu.model'
import MenuBit from '../fce/menu.bit'
import State from '../../99.core/state'

import * as ActLib from '../../00.library.unit/library.action'
import * as ActUnt from '../../01.unit.unit/unit.action'
import * as ActAct from '../../02.action.unit/action.action'

import * as Grid from '../../val/grid'
import * as Align from '../../val/align'
import * as Color from '../../val/console-color'

import * as SHAPE from '../../val/shape'
import * as FOCUS from '../../val/focus'

import * as ActMnu from '../menu.action'

import * as ActTrm from '../../80.terminal.unit/terminal.action'
import * as ActChc from '../../85.choice.unit/choice.action'
import * as ActPut from '../../84.input.unit/input.action'

import * as ActGrd from '../../81.grid.unit/grid.action'
import * as ActCns from '../../83.console.unit/console.action'

import * as ActTrn from '../../act/turn.action'
import * as ActClr from '../../act/color.action'
import * as ActSow from '../../act/sower.action'

import * as PVT from '../../val/pivot'

const FS = require('fs-extra')
const path = require('path')

let bit: any, lst: any, dex: any, idx: any, dat: any, src: any

export const libraryMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    if (!ste) {
        if (bal?.slv) bal.slv({ mnuBit: { idx: 'library-menu-headless' } })
        return cpy
    }

    bit = await ste.hunt(ActTrm.CLEAR_TERMINAL, {})

    bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
        idx: 'cns00',
        src: 'LIBRARY MENU',
    })
    bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '-----------',
    })

    lst = [
        ActUnt.UPDATE_UNIT.split(']')[1],
        ActAct.UPDATE_ACTION.split(']')[1],
        ActUnt.CREATE_UNIT.split(']')[1],
        ActUnt.FLATTEN_UNIT.split(']')[1],
        ActLib.FLAT_LIBRARY.split(']')[1],
        ActLib.PROGRESS_LIBRARY.split(']')[1],
        ActLib.UPDATE_LIBRARY.split(']')[1],
        ActLib.LIST_LIBRARY.split(']')[1],
        ActLib.AUDIT_LIBRARY.split(']')[1],
        ActLib.LAUNCH_LIBRARY.split(']')[1],
        'ROOT MENU',
    ]

    const descriptions: Record<string, string> = {
        [ActUnt.UPDATE_UNIT.split(']')[1]]:
            '-Update an existing unit\nin the library.',
        [ActAct.UPDATE_ACTION.split(']')[1]]:
            '-Update an action for\na specific unit \nso the library can use the action',
        [ActUnt.CREATE_UNIT.split(']')[1]]:
            '-Create a new unit\nwith a specified verb.',
        [ActUnt.FLATTEN_UNIT.split(']')[1]]:
            '-Flatten a unit into\nits constituent files.',
        [ActLib.FLAT_LIBRARY.split(']')[1]]:
            '-Flatten library code\ninto data/flat.',
        [ActLib.UPDATE_LIBRARY.split(']')[1]]:
            '-Regenerate the library\nwiring manifest (BEE.ts).',
        [ActLib.LIST_LIBRARY.split(']')[1]]:
            '-List all the units\ncurrently in the library.',
        [ActLib.AUDIT_LIBRARY.split(']')[1]]:
            '-Compare fleet repositories against\nthe Central Coordination Manifest.',
        [ActLib.PROGRESS_LIBRARY.split(']')[1]]:
            '-Synchronize 995.library across\nsibling repositories.',
        [ActLib.LAUNCH_LIBRARY.split(']')[1]]: '-Launch library urls.',
        'ROOT MENU': '-Return to the root menu.',
    }

    bit = await ste.hunt(ActGrd.UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 12,
    })
    bit = await ste.hunt(ActChc.OPEN_CHOICE, {
        dat: {
            clr0: Color.BLACK,
            clr1: Color.YELLOW,
            cb: (choice: string) => {
                const text = descriptions[choice] || 'No description available.'
                text.split('\n').forEach((s: string) =>
                    ste.hunt(ActCns.UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: s,
                    }),
                )
            },
        },
        src: Align.VERTICAL,
        lst,
        net: bit.grdBit.dat,
    })
    src = bit?.chcBit?.src

    switch (src) {
        case ActLib.LAUNCH_LIBRARY.split(']')[1]: {
            bit = await ste.hunt(ActLib.LAUNCH_LIBRARY, {})
            break
        }

        case ActAct.UPDATE_ACTION.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActLib.LIST_LIBRARY, {})
            lst = bit.libBit.lst

            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 12,
            })
            bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst,
                net: bit.grdBit.dat,
            })
            src = bit.chcBit.src

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActUnt.LIST_UNIT, { src })
            lst = bit.untBit.lst

            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 12,
            })
            bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst,
                net: bit.grdBit.dat,
            })
            idx = bit.chcBit.src

            const updateActionBit = await ste.hunt(ActAct.UPDATE_ACTION, { idx, src })
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            break
        }

        case ActUnt.CREATE_UNIT.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 6,
            })
            bit = await ste.hunt(ActPut.OPEN_INPUT, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst,
                txt: 'input verb',
                net: bit.grdBit.dat,
            })
            idx = bit.putBit.src

            const createUnitBit = await ste.hunt(ActUnt.CREATE_UNIT, { idx })
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActMnu.PRINT_MENU, createUnitBit)
            break
        }

        case ActUnt.UPDATE_UNIT.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActUnt.CONTAIN_UNIT, { src })
            const fullPivotList = bit.untBit.lst
            const pivotList = fullPivotList.map((item: string) => {
                const clean = item.replace(/[[\]]/g, '')
                const parts = clean.split('/')
                return `[${parts[parts.length - 1]}]`
            })
            lst = pivotList

            let pivotSelection = ''
            dex = 0
            while (pivotSelection === '') {
                const items = pivotList.slice(dex, dex + 10)
                const list = [...items]
                if (pivotList.length > 10) list.push('MORE')

                bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })
                bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                    dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                    src: Align.VERTICAL,
                    lst: list,
                    net: bit.grdBit.dat,
                })

                src = bit.chcBit.src
                if (src === 'MORE') {
                    dex = dex + 10 >= pivotList.length ? 0 : dex + 10
                    await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
                } else {
                    const selectedIdx = pivotList.indexOf(src)
                    pivotSelection = fullPivotList[selectedIdx]
                }
            }

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})

            if (pivotSelection)
                pivotSelection = pivotSelection.replace(/[[\]]/g, '')

            let parentDir = process.cwd()
            while (
                parentDir &&
                !(
                    FS.existsSync(path.join(parentDir, 'apps')) &&
                    FS.existsSync(path.join(parentDir, 'packages')) &&
                    FS.existsSync(path.join(parentDir, 'package.json'))
                )
            ) {
                const parent = path.dirname(parentDir)
                if (parent === parentDir) break
                parentDir = parent
            }
            src = path.resolve(parentDir, pivotSelection)

            ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `Resolving pivot: ${pivotSelection} -> ${src}`,
            })

            bit = await ste.hunt(ActUnt.LIST_UNIT, { src })
            const fullUnitList = bit.untBit.lst
            const unitList = fullUnitList.map((item: string) => {
                const parts = item.split('/')
                return parts[parts.length - 1]
            })

            let unitSelection = ''
            dex = 0
            while (unitSelection === '') {
                const items = unitList.slice(dex, dex + 10)
                const list = [...items]
                if (unitList.length > 10) list.push('MORE')

                bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })
                bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                    dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                    src: Align.VERTICAL,
                    lst: list,
                    net: bit.grdBit.dat,
                })

                const res = bit.chcBit.src
                if (res === 'MORE') {
                    dex = dex + 10 >= unitList.length ? 0 : dex + 10
                    await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
                } else {
                    const selectedIdx = unitList.indexOf(res)
                    idx = fullUnitList[selectedIdx]
                    unitSelection = res
                }
            }

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})

            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 2,
            })
            bit = await ste.hunt(ActPut.OPEN_INPUT, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst,
                txt: 'input verb',
                net: bit.grdBit.dat,
            })
            dat = bit.putBit.src

            const updateUnitBit = await ste.hunt(ActUnt.UPDATE_UNIT, {
                idx,
                src,
                dat,
            })
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActMnu.PRINT_MENU, updateUnitBit)
            break
        }

        case ActUnt.FLATTEN_UNIT.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            const isRepoRoot = (dir: string) => {
                try {
                    return (
                        FS.existsSync(path.join(dir, 'apps')) &&
                        FS.existsSync(path.join(dir, 'packages')) &&
                        FS.existsSync(path.join(dir, 'package.json'))
                    )
                } catch {
                    return false
                }
            }

            let repoRoot = process.cwd()
            while (repoRoot && !isRepoRoot(repoRoot)) {
                const parent = path.dirname(repoRoot)
                if (parent === repoRoot) break
                repoRoot = parent
            }

            lst = ['apps', 'packages']
            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 12,
            })
            bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst,
                net: bit.grdBit.dat,
            })

            src = bit.chcBit.src
            if (!src) break
            const targetFolder = src.replace(/[[\]]/g, '').trim()
            const targetPath = path.join(repoRoot, targetFolder)

            const IGNORE_MENU_DIRS = new Set([
                'node_modules',
                'dist',
                'data',
                '.git',
            ])
            let childDirs: string[] = []

            try {
                if (FS.existsSync(targetPath)) {
                    const entries = FS.readdirSync(targetPath, {
                        withFileTypes: true,
                    })
                    for (const entry of entries) {
                        if (
                            entry.isDirectory() &&
                            !IGNORE_MENU_DIRS.has(entry.name)
                        ) {
                            childDirs.push(entry.name)
                        }
                    }
                }
            } catch {
                // ignore read error
            }

            childDirs.sort((a, b) => a.localeCompare(b))

            if (childDirs.length === 0) {
                await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `No directories found in ${targetFolder}`,
                })
                break
            }

            let childSelection = ''
            dex = 0
            while (childSelection === '') {
                const items = childDirs.slice(dex, dex + 10)
                const list = [...items]
                if (childDirs.length > 10) list.push('MORE')

                bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })
                bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                    dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                    src: Align.VERTICAL,
                    lst: list,
                    net: bit.grdBit.dat,
                })

                src = bit.chcBit.src
                if (src === 'MORE') {
                    dex = dex + 10 >= childDirs.length ? 0 : dex + 10
                    await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
                } else {
                    childSelection = src
                }
            }

            if (!childSelection) break
            const selectedDir = childSelection.replace(/[[\]]/g, '').trim()
            const selectedFullPath = path.join(targetPath, selectedDir)

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            await ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `Flattening ${targetFolder}/${selectedDir}... Please wait.`,
            })

            const flattenUnitBit = await ste.hunt(ActUnt.FLATTEN_UNIT, {
                idx: selectedDir,
                src: selectedFullPath,
            })

            await ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `Flattened to ${flattenUnitBit?.untBit?.src || selectedDir}`,
            })

            bit = await ste.hunt(ActMnu.PRINT_MENU, flattenUnitBit)
            break
        }

        case ActLib.FLAT_LIBRARY.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            await ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src: 'Flattening library... Please wait.',
            })
            bit = await ste.hunt(ActLib.FLAT_LIBRARY, {})
            await ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src:
                    'Library flattened to ' + (bit?.libBit?.src || 'data/flat'),
            })
            bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
            break
        }

        case ActLib.LIST_LIBRARY.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActLib.LIST_LIBRARY, {})
            lst = bit.libBit.lst

            if (lst.length === 0) {
                bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'No Libraries Found',
                })
            } else {
                bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'Listing Libraries...',
                })
                lst.forEach((a: string) =>
                    ste.hunt(ActCns.UPDATE_CONSOLE, { idx: 'cns00', src: a }),
                )
            }

            await new Promise((resolve) => setTimeout(resolve, 3000))
            break
        }

        case ActLib.AUDIT_LIBRARY.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
                idx: 'cns00',
                src: '>> Executing Fleet Drift Audit...',
            })

            bit = await ste.hunt(ActLib.AUDIT_LIBRARY, {})
            const data = bit?.libBit?.dat

            if (data) {
                const { totalTracked, alignedCount, driftedCount } = data
                ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `--- AUDIT SUMMARY ---`,
                })
                ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `Total Repositories: ${totalTracked}`,
                })
                ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `Aligned: ${alignedCount}`,
                })
                ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `Drifted: ${driftedCount}`,
                })
            }

            await new Promise((resolve) => setTimeout(resolve, 333))
            bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
            break
        }

        case ActLib.UPDATE_LIBRARY.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActLib.LIST_LIBRARY, {})
            const fullLibList = bit.libBit.lst
            const displayLibList = fullLibList.map((item: string) => {
                const clean = item.replace(/[[\]]/g, '')
                const parts = clean.split('/')
                return `[${parts[parts.length - 1]}]`
            })

            let libSelection = ''
            dex = 0
            while (libSelection === '') {
                const items = displayLibList.slice(dex, dex + 10)
                const list = [...items]
                if (displayLibList.length > 10) list.push('MORE')

                bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 12,
                })
                bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                    dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                    src: Align.VERTICAL,
                    lst: list,
                    net: bit.grdBit.dat,
                })

                src = bit.chcBit.src
                if (src === 'MORE') {
                    dex = dex + 10 >= displayLibList.length ? 0 : dex + 10
                    await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
                } else {
                    const selectedIdx = displayLibList.indexOf(src)
                    libSelection = fullLibList[selectedIdx]
                }
            }

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActLib.UPDATE_LIBRARY, {
                src: libSelection,
            })
            bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
            break
        }

                case ActLib.PROGRESS_LIBRARY.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActLib.SCAN_LIBRARY, {})
            const targets: string[] = bit?.libBit?.lst || []

            if (targets.length === 0) {
                await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [FLEET NOTICE] No sibling repositories discovered.',
                })
                bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
                break
            }

            const allSiblingsLabel = `[ALL SIBLINGS (${targets.length})]`
            lst = [allSiblingsLabel, ...targets]

            const descriptions: Record<string, string> = {
                [allSiblingsLabel]: `-Atomically broadcast 995.library\nacross all ${targets.length} sibling repositories.`,
            }

            for (const t of targets) {
                descriptions[t] = `-Synchronize 995.library into\n${t}`
            }

            bit = await ste.hunt(ActGrd.UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 12,
            })
            bit = await ste.hunt(ActChc.OPEN_CHOICE, {
                dat: {
                    clr0: Color.BLACK,
                    clr1: Color.YELLOW,
                    cb: (choice: string) => {
                        const text = descriptions[choice] || 'No description available.'
                        text.split('\n').forEach((s: string) =>
                            ste.hunt(ActCns.UPDATE_CONSOLE, {
                                idx: 'cns00',
                                src: s,
                            }),
                        )
                    },
                },
                src: Align.VERTICAL,
                lst,
                net: bit.grdBit.dat,
            })
            src = bit?.chcBit?.src

            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})

            if (src === allSiblingsLabel || src === '[ALL SIBLINGS]') {
                // Two-phase safety confirmation modal
                const confirmGrid = await ste.hunt(ActGrd.UPDATE_GRID, {
                    x: 0,
                    y: 4,
                    xSpan: 4,
                    ySpan: 4,
                })
                const confirmChoice = await ste.hunt(ActChc.OPEN_CHOICE, {
                    dat: { clr0: Color.BLACK, clr1: Color.RED },
                    src: Align.VERTICAL,
                    lst: [
                        '[NO]  CANCEL BATCH SYNC',
                        `[YES] BROADCAST TO ${targets.length} SIBLINGS`,
                    ],
                    net: confirmGrid.grdBit.dat,
                })

                await ste.hunt(ActTrm.CLEAR_TERMINAL, {})

                if (confirmChoice?.chcBit?.src?.startsWith('[YES]')) {
                    await ste.hunt(ActCns.UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> [SAGA] Initiating batch broadcast to ${targets.length} sibling repos...`,
                    })

                    const sagaRes: any = await ste.hunt(ActLib.PROGRESS_LIBRARY_SAGA, {
                        lst: targets,
                    })

                    if (sagaRes?.libBit?.idx === 'progress-library-saga-error') {
                        await ste.hunt(ActMnu.SAGA_TORN_STATE_MENU, {
                            dat: sagaRes?.libBit?.dat,
                        })
                        return cpy
                    }

                    await ste.hunt(ActCns.UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> [OK] Fleet propagation completed for ${targets.length} repositories.`,
                    })
                } else {
                    await ste.hunt(ActCns.UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: '>> [ABORT] Batch broadcast cancelled by operator.',
                    })
                }
            } else if (src) {
                await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [SAGA] Progressing library to target: ${src}`,
                })

                const sagaRes: any = await ste.hunt(ActLib.PROGRESS_LIBRARY_SAGA, {
                    lst: [src],
                })

                if (sagaRes?.libBit?.idx === 'progress-library-saga-error') {
                    await ste.hunt(ActMnu.SAGA_TORN_STATE_MENU, {
                        dat: sagaRes?.libBit?.dat,
                    })
                    return cpy
                }

                await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [OK] Target synchronization complete: ${src}`,
                })
            } else {
                await ste.hunt(ActCns.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: '>> [NOTICE] No directory selected.',
                })
            }

            bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
            break
        }

        case ActMnu.UPDATE_MENU.split(']')[1]: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActMnu.UPDATE_MENU, {})
            bit = await ste.hunt(ActMnu.PRINT_MENU, bit)
            break
        }

        case 'ROOT MENU': {
            // Defensive teardown prior to returning to master navigation switchboard
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActMnu.UPDATE_MENU, {})
            return cpy
        }

        default: {
            await ste.hunt(ActTrm.CLEAR_TERMINAL, {})
            bit = await ste.hunt(ActTrm.CLOSE_TERMINAL, {})
            break
        }
    }

    const timer = setTimeout(async () => {
        bit = await ste.hunt(ActMnu.LIBRARY_MENU, {})
    }, 333)
    if (timer && typeof timer.unref === 'function') timer.unref()

    return cpy
}