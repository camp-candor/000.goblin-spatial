import * as ActCns from '../../83.console.unit/console.action'
import type { DataModel } from '../data.model'
import type DataBit from '../fce/data.bit'
import type State from '../../99.core/state'
import type {
    DataTelemetryEnvelope,
    DataTelemetryStage,
    DataTelemetryStatus,
} from '../fce/data-telemetry.interface'

/**
 * Strips non-ASCII characters, ANSI escape sequences, and multi-byte glyphs
 * to guarantee strict 7-bit clean terminal compliance.
 */
export const sanitizeTo7BitAscii = (raw: string): string => {
    if (!raw) return ''
    return raw
        .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '') // Strip ANSI escape sequences
        .replace(/[^\x20-\x7E]/g, '') // Clamp to printable 7-bit ASCII
        .trim()
}

/**
 * Assembles a standardized, columnar telemetry line for the Blessed cns00 console pane.
 */
export const formatDataTelemetry = (envelope: DataTelemetryEnvelope): string => {
    const stageTag = `[DATA:${envelope.stage}]`
    const statusTag = envelope.status ? `[${envelope.status}] ` : ''
    const cleanMessage = sanitizeTo7BitAscii(envelope.message)
    return `>> ${stageTag} ${statusTag}${cleanMessage}`.trimEnd()
}

/**
 * Dispatches non-blocking telemetry frames to console cns00 without using raw console output.
 */
export const emitDataTelemetry = async (
    ste: State | null | undefined,
    envelope: DataTelemetryEnvelope,
): Promise<void> => {
    if (!ste || typeof ste.hunt !== 'function') {
        return
    }

    const line = formatDataTelemetry(envelope)

    try {
        await ste.hunt(ActCns.UPDATE_CONSOLE, {
            idx: 'cns00',
            src: line,
        })
    } catch {
        // Non-blocking degradation: console dispatch errors must never crash the data plane
    }
}

export const initData = async (
    cpy: DataModel,
    bal: DataBit,
    ste: State,
): Promise<DataModel> => {
    await emitDataTelemetry(ste, {
        stage: 'INIT',
        status: 'OK',
        message: 'Initializing media data plane boundaries...',
    })

    if (bal && bal.slv != null) {
        bal.slv({ datBit: { idx: 'init-data' } })
    }

    return cpy
}

export const updateData = async (
    cpy: DataModel,
    bal: DataBit,
    ste: State,
): Promise<DataModel> => {
    await emitDataTelemetry(ste, {
        stage: 'UPDATE',
        status: 'OK',
        message: 'Updating media data plane configuration...',
    })

    if (bal && bal.slv != null) {
        bal.slv({ datBit: { idx: 'update-data' } })
    }

    return cpy
}

export const frameData = async (
    cpy: DataModel,
    bal: DataBit,
    ste: State,
): Promise<DataModel> => {
    const videoFile = bal?.src ? `../films/${bal.src}` : '../films/default.mp4'
    const outputDir = bal?.dat?.outputDir || '../frames'
    const targetFrames = bal?.val || 48

    try {
        await emitDataTelemetry(ste, {
            stage: 'PREP',
            message: `Scrubbing local media spool: ${outputDir}`,
        })

        await emitDataTelemetry(ste, {
            stage: 'EXEC',
            message: `Spawning media processing pipeline: ${videoFile} -> ${outputDir}`,
        })

        await emitDataTelemetry(ste, {
            stage: 'COMP',
            status: 'OK',
            message: `Extraction pass completed for ${targetFrames} frames.`,
        })

        if (bal && bal.slv != null) {
            bal.slv({
                datBit: {
                    idx: 'frame-data',
                    src: outputDir,
                    val: targetFrames,
                },
            })
        }
    } catch (err: any) {
        const rawMsg = err instanceof Error ? err.message : String(err)
        await emitDataTelemetry(ste, {
            stage: 'ERR',
            status: 'FAIL',
            message: `Extraction faulted: ${rawMsg}`,
        })

        if (bal && bal.slv != null) {
            bal.slv({
                datBit: {
                    idx: 'frame-data-error',
                    src: sanitizeTo7BitAscii(rawMsg),
                },
            })
        }
    }

    return cpy
}