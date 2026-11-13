/* eslint-disable */
import 'dotenv/config'
import { program } from 'commander'
import { exec as execCb } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const exec = promisify(execCb)

// 1. Setup CLI
const isDirectExecution = () => {
    if (!process.argv[1]) return false
    const entry = path.resolve(process.argv[1]).toLowerCase()
    const current = path.resolve(fileURLToPath(import.meta.url)).toLowerCase()
    return entry === current || entry.endsWith('run.ts')
}

program.option('--first').option('-t, --separator <char>')
if (isDirectExecution()) {
    program.parse(process.argv)
}
const options = program.opts()

export interface IngestedSpatialTopologySummary {
    readonly seriesSlug: string
    readonly filePath: string
    readonly merkleRoot: string
    readonly nodeCount: number
    readonly rawManifest: Record<string, any>
}

export interface SpatialIngestionToggleOptions {
    readonly repoRoot?: string
    readonly enabled?: boolean
    readonly onTelemetry?: (line: string) => Promise<void> | void
}

/**
 * [Task 1.3.2] Configure Spatial Ingestion Toggles:
 * Parses newly transferred static topology graphs in manifests/*-topology.json upon terminal boot.
 */
export const ingestTransferredTopologyGraphs = async (
    opts: SpatialIngestionToggleOptions = {},
): Promise<IngestedSpatialTopologySummary[]> => {
    const enabled =
        opts.enabled ?? process.env.SPATIAL_INGEST_TOPOLOGY !== '0'
    if (!enabled) {
        if (opts.onTelemetry) {
            await opts.onTelemetry(
                '>> [SPATIAL:INGEST] Static topology ingestion toggle is DISABLED.',
            )
        }
        return []
    }

    const repoRoot =
        opts.repoRoot || path.resolve(import.meta.dirname, '../..')
    const manifestsDir = path.join(repoRoot, 'manifests')

    ;(globalThis as any).INGESTED_TOPOLOGY_MANIFESTS =
        (globalThis as any).INGESTED_TOPOLOGY_MANIFESTS || {}

    if (!fs.existsSync(manifestsDir)) {
        if (opts.onTelemetry) {
            await opts.onTelemetry(
                '>> [SPATIAL:INGEST] No manifests/ directory present; awaiting fleet topology drop.',
            )
        }
        return []
    }

    const files = fs
        .readdirSync(manifestsDir)
        .filter((f) => f.endsWith('.json'))
        .sort((a, b) => a.localeCompare(b))

    const ingested: IngestedSpatialTopologySummary[] = []

    for (const file of files) {
        const filePath = path.join(manifestsDir, file)
        try {
            const rawText = fs.readFileSync(filePath, 'utf8')
            const parsed = JSON.parse(rawText)
            const seriesSlug =
                parsed.series_slug ||
                parsed.topologyId ||
                file.replace(/-topology\.json$/, '').replace(/\.json$/, '')
            const merkleRoot = String(
                parsed.merkle_root ||
                    parsed.merkleRootHex ||
                    parsed._meta?.state_hash ||
                    '0'.repeat(64),
            )
            const nodesObj =
                parsed.nodes || parsed.entities?.locations || {}
            const nodeCount = Array.isArray(parsed.cells)
                ? parsed.cells.length
                : Object.keys(nodesObj).length

            const summary: IngestedSpatialTopologySummary = Object.freeze({
                seriesSlug,
                filePath,
                merkleRoot,
                nodeCount,
                rawManifest: parsed,
            })

            ;(globalThis as any).INGESTED_TOPOLOGY_MANIFESTS[seriesSlug] =
                parsed
            if (
                !(globalThis as any).ACTIVE_TOPOLOGY_MANIFEST ||
                seriesSlug === 'gotham-trinity-crisis'
            ) {
                ;(globalThis as any).ACTIVE_TOPOLOGY_MANIFEST = parsed
            }

            ingested.push(summary)

            if (opts.onTelemetry) {
                await opts.onTelemetry(
                    `>> [SPATIAL:INGEST] [OK] Parsed static topology '${seriesSlug}' (${nodeCount} node(s) | Merkle: ${merkleRoot.slice(0, 12)}...)`,
                )
            }
        } catch (err: any) {
            if (opts.onTelemetry) {
                await opts.onTelemetry(
                    `:: [SPATIAL:INGEST_ERR] Malformed topology manifest ${file}: ${err?.message || String(err)}`,
                )
            }
        }
    }

    return ingested
}

export interface PackageTerminalMetadata {
    name: string
    globalKey: string
    menuTitle: string
    menuDesc: string
    targetDir: string
}

/**
 * Sweeps packages/ for valid TypeScript packages and extracts Schema-Driven metadata.
 */
export const getExistingPackages = (): PackageTerminalMetadata[] => {
    const packagesDir = path.resolve(import.meta.dirname, '../../packages')
    if (!fs.existsSync(packagesDir)) return []

    const entries = fs.readdirSync(packagesDir, { withFileTypes: true })
    const results: PackageTerminalMetadata[] = []

    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'dist') continue
        const targetDir = path.join(packagesDir, entry.name)
        const tsconfigPath = path.join(targetDir, 'tsconfig.json')
        if (!fs.existsSync(tsconfigPath)) continue

        const pkgJsonPath = path.join(targetDir, 'package.json')
        let terminalMeta: any = null

        if (fs.existsSync(pkgJsonPath)) {
            try {
                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'))
                if (pkgJson.terminal) {
                    terminalMeta = pkgJson.terminal
                }
            } catch {
                // Ignore parse errors on intermediate files
            }
        }

        if (terminalMeta && terminalMeta.globalKey && terminalMeta.menuTitle) {
            results.push({
                name: entry.name,
                globalKey: terminalMeta.globalKey,
                menuTitle: terminalMeta.menuTitle,
                menuDesc:
                    terminalMeta.menuDesc ||
                    `Open ${entry.name} management console.`,
                targetDir,
            })
        } else {
            // Heuristic Fallback
            const domain = entry.name.includes('.')
                ? entry.name.split('.').slice(1).join('.')
                : entry.name
            const upper = domain.toUpperCase()
            results.push({
                name: entry.name,
                globalKey: upper,
                menuTitle: `${upper} MENU`,
                menuDesc: `Open the ${domain} menu\nto manage ${domain}.`,
                targetDir,
            })
        }
    }

    return results
}

const getRootIdentity = () => {
    let curr = process.cwd()
    while (curr && curr !== path.dirname(curr)) {
        const pkgPath = path.join(curr, 'package.json')
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
                if (pkg.workspaces || fs.existsSync(path.join(curr, '.git'))) {
                    const rawName =
                        pkg.name || path.basename(curr) || '995.library'
                    const name = String(rawName).replace(/^@[^/]+\//, '').trim()
                    const rawVersion = pkg.version
                        ? String(pkg.version).replace(/^v/, '')
                        : '0.1.0'
                    const version = `v${rawVersion}`
                    return { name, version, titleBanner: `${name} ${version}` }
                }
            } catch {}
        }
        curr = path.dirname(curr)
    }
    return {
        name: '995.library',
        version: 'v0.1.0',
        titleBanner: '995.library v0.1.0',
    }
}

// 2. Post-Build Initialization Logic
const init = async () => {
    console.log('>> [INIT] Bootstrapping Terminal Orchestrator...')

    global.window = global as any
    ;(global as any).PIVOTS = (global as any).PIVOTS || {}

    const idx = options.separator
    if (idx) console.log(`   Targeting: ${idx}`)

    const libPath = path.resolve(import.meta.dirname, './dist/995.library')
    const existingPackages = getExistingPackages()

    try {
        const LIBRARY = require(path.join(libPath, 'hunt'))
        global.LIBRARY = LIBRARY

        const LIBRARY_ACTION = require(
            path.join(libPath, '00.library.unit/library.action'),
        )

        await LIBRARY.hunt(LIBRARY_ACTION.INIT_LIBRARY, {
            val: 1,
            dat: null,
            src: null,
            idx: idx,
        })

        const identity = getRootIdentity()
        const CONSOLE_ACTION_LIBRARY = require(
            path.join(libPath, '83.console.unit/console.action'),
        )
        const cnsBit = await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.READ_CONSOLE, {
            idx: 'cns00',
        })
        const logWidget = cnsBit?.cnsBit?.dat?.bit
        if (logWidget && Array.isArray(logWidget.logLines)) {
            const libPkgPath = path.resolve(
                import.meta.dirname,
                './package.json',
            )
            const libPkg = fs.existsSync(libPkgPath)
                ? JSON.parse(fs.readFileSync(libPkgPath, 'utf8'))
                : { version: '1.0.12' }
            logWidget.logLines = [
                '-----------',
                `${identity.name} ${identity.version}`,
                `LIBRARY V${libPkg.version}`,
                '-----------',
            ]
            logWidget.setItems(logWidget.logLines)
            if (logWidget.screen) logWidget.screen.render()
        }

        const MENU_ACTION_LIBRARY = require(
            path.join(libPath, '98.menu.unit/menu.action'),
        )

        await new Promise((resolve) => setTimeout(resolve, 10))

        await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [OK] Master Bus Initialized',
        })

        // [Task 1.3.2] Parse newly transferred static topology graphs upon terminal boot
        await ingestTransferredTopologyGraphs({
            onTelemetry: async (line: string) => {
                await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: line,
                })
            },
        })

        // 3. Dynamic Package Injection & Bus Wiring
        const packagesDist = path.resolve(
            import.meta.dirname,
            '../../packages/dist',
        )
        if (fs.existsSync(packagesDist)) {
            const distPkgJson = path.join(packagesDist, 'package.json')
            if (!fs.existsSync(distPkgJson)) {
                fs.writeFileSync(
                    distPkgJson,
                    JSON.stringify({ type: 'commonjs' }, null, 2),
                )
            }
        }

        for (const pkg of existingPackages) {
            try {
                let pkgDistPath = path.resolve(
                    import.meta.dirname,
                    `../../packages/dist/${pkg.name}`,
                )
                if (!fs.existsSync(pkgDistPath)) {
                    const localDist = path.resolve(
                        import.meta.dirname,
                        `../../packages/${pkg.name}/dist`,
                    )
                    if (fs.existsSync(localDist)) {
                        pkgDistPath = localDist
                    } else {
                        pkgDistPath = pkg.targetDir
                    }
                }

                const huntModulePath = path.join(pkgDistPath, 'hunt')
                const MODULE = require(huntModulePath)
                const instance = MODULE.default || MODULE

                // Inject into global namespace & central pivot registry
                ;(global as any)[pkg.globalKey] = instance
                ;(global as any).PIVOTS[pkg.name] = instance
                ;(global as any).PIVOTS[pkg.globalKey] = instance

                const menuActionPath = path.join(
                    pkgDistPath,
                    '98.menu.unit/menu.action',
                )
                if (
                    !fs.existsSync(menuActionPath + '.js') &&
                    !fs.existsSync(menuActionPath + '.ts') &&
                    !fs.existsSync(menuActionPath)
                ) {
                    // Headless pivot without visual menu unit
                    await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> [INFO] Mounted headless pivot: [${pkg.name}] as global.${pkg.globalKey}`,
                    })
                    continue
                }

                const MENU_ACTION = require(menuActionPath)

                // Mount sub-menu into root Blessed navigation
                await LIBRARY.hunt(MENU_ACTION_LIBRARY.ROUTE_MENU, {
                    idx: pkg.menuTitle,
                    src: pkg.menuDesc,
                    fnc: async () => {
                        await new Promise<void>((resolve) => {
                            ;(global as any)[pkg.globalKey].hunt(
                                MENU_ACTION.INIT_MENU,
                                {
                                    slv: resolve,
                                },
                            )
                        })
                        await LIBRARY.hunt(MENU_ACTION_LIBRARY.OPEN_MENU, {
                            src: '',
                        })
                    },
                })

                if (
                    pkg.name === '301.spatial' &&
                    MENU_ACTION.EXPORT_SIGNED_SPATIAL_RECEIPT
                ) {
                    await LIBRARY.hunt(MENU_ACTION_LIBRARY.ROUTE_MENU, {
                        idx: '[P] EXPORT SIGNED SPATIAL RECEIPT TO ENGINE',
                        src: 'Package raycast and acoustic proofs and stage signed receipt into 000.series-sower-engine.',
                        fnc: async () => {
                            await new Promise<void>((resolve) => {
                                ;(global as any)[pkg.globalKey].hunt(
                                    MENU_ACTION.EXPORT_SIGNED_SPATIAL_RECEIPT,
                                    {
                                        slv: resolve,
                                    },
                                )
                            })
                            await LIBRARY.hunt(MENU_ACTION_LIBRARY.OPEN_MENU, {
                                src: '',
                            })
                        },
                    })
                }

                await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [OK] Mounted UI Pivot: [${pkg.name}] -> ${pkg.menuTitle}`,
                })
            } catch (err: any) {
                await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: [WARN] Skipping pivot [${pkg.name}]: ${err.message}`,
                })
            }
        }

        await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [READY] Terminal Cockpit active',
        })
        await LIBRARY.hunt(CONSOLE_ACTION_LIBRARY.UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: [KEYS] UP/DOWN or J/K: Navigate | ENTER: Select',
        })

        // Direct target dispatch if specified via -t / --separator (excluding default 'library')
        if (idx && idx.toLowerCase() !== 'library') {
            const target = existingPackages.find(
                (p) =>
                    p.name.toLowerCase() === idx.toLowerCase() ||
                    p.globalKey.toLowerCase() === idx.toLowerCase() ||
                    p.menuTitle.toLowerCase() === idx.toLowerCase() ||
                    p.name.endsWith(`.${idx.toLowerCase()}`) ||
                    p.name.split('.')[1]?.toLowerCase() === idx.toLowerCase(),
            )
            if (target) {
                let pkgDistPath = path.resolve(
                    import.meta.dirname,
                    `../../packages/dist/${target.name}`,
                )
                if (!fs.existsSync(pkgDistPath)) {
                    const localDist = path.resolve(
                        import.meta.dirname,
                        `../../packages/${target.name}/dist`,
                    )
                    if (fs.existsSync(localDist)) {
                        pkgDistPath = localDist
                    } else {
                        pkgDistPath = target.targetDir
                    }
                }
                const menuActionPath = path.join(
                    pkgDistPath,
                    '98.menu.unit/menu.action',
                )
                if (
                    fs.existsSync(menuActionPath + '.js') ||
                    fs.existsSync(menuActionPath + '.ts') ||
                    fs.existsSync(menuActionPath)
                ) {
                    const TARGET_ACTION = require(menuActionPath)
                    await (global as any)[target.globalKey].hunt(
                        TARGET_ACTION.INIT_MENU,
                        {
                            slv: async () => {
                                await LIBRARY.hunt(
                                    MENU_ACTION_LIBRARY.OPEN_MENU,
                                    { src: '' },
                                )
                            },
                        },
                    )
                    return
                }
            }
        }

        await LIBRARY.hunt(MENU_ACTION_LIBRARY.OPEN_MENU, { src: '' })
    } catch (err: any) {
        console.error(':: [FAIL] Terminal Runtime Panic:', err)
        process.exit(1)
    }
}

// 4. Main Build & Startup Pipeline
const main = async () => {
    // Fail-safe operator exit: pressing 'q' at any cockpit depth leaves the
    // curses alternate screen buffer and returns control to the shell.
    // Armed before boot so it cannot be lost to a late init() path.
    process.stdin.on('data', (chunk: Buffer) => {
        if (chunk.toString('utf8') === 'q') {
            try {
                process.stdout.write('\x1b[?1049l')
                const std = process.stdout as any
                if (typeof std.cursorTo === 'function') std.cursorTo(0, 0)
                process.stdout.write('\x1b[?25h')
                process.stdout.write('\x1b[0m')
                process.stdout.write('\n>> [OK] Cockpit closed by operator (q). Goodbye.\n')
            } catch {
                // Terminal restore is best-effort on forced teardown.
            }
            process.exit(0)
        }
    })

    try {
        const existingPackages = getExistingPackages()
        console.log(
            `>> [BUILD] Compiling ${existingPackages.length + 1} TypeScript References (tsc -b)...`,
        )
        const buildTargets = [
            '995.library',
            ...existingPackages.map((p) => `../../packages/${p.name}`),
        ].join(' ')

        const startTime = Date.now()
        const heartbeat = setInterval(() => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
            console.log(`>> [BUILD] Compiling references... (${elapsed}s elapsed)`)
        }, 3000)

        var { stdout, stderr } = await exec(`tsc -b ${buildTargets}`, {
            cwd: import.meta.dirname,
        })
        clearInterval(heartbeat)

        const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`>> [BUILD:OK] All references compiled in ${totalElapsed}s`)

        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)

        await init()
    } catch (err: any) {
        console.error(':: [FAIL] Build Failed:')
        console.error(err.stdout || err.message)
        process.exit(1)
    }
}

if (isDirectExecution()) {
    main()
}
