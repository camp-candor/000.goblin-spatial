export const initPort = (cpy: PortModel, bal: PortBit, ste: State) => {
    debugger
    return cpy
}

export const updatePort = (cpy: PortModel, bal: PortBit, ste: State) => {
    return cpy
}

import { PortModel } from '../port.model'
import PortBit from '../fce/port.bit'
import State from '../../99.core/state'

import {
  QueryStripValidationResult,
  ScrubbedSpatialQuery,
  SpatialQueryType
} from '../fce/port.interface.js';
import {
  BANNED_NARRATIVE_TAGS,
  SpatialQueryDiscriminatorSchema
} from '../val/port.model.js';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj as object)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj as Readonly<T>;
}

export function detectBannedNarrativeTags(raw: Record<string, unknown>): string[] {
  const detected: string[] = [];
  for (const tag of BANNED_NARRATIVE_TAGS) {
    if (tag in raw) {
      detected.push(tag);
    }
  }
  return detected;
}

/**
 * Validates incoming raw query payload, rejects forbidden narrative tokens,
 * validates strictly via Zod, and returns deep-frozen scrubbed spatial query DTO.
 */
export function scrubAndValidateSpatialQuery(
  rawInput: unknown
): QueryStripValidationResult {
  if (rawInput === null || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    return {
      valid: false,
      errors: ['QUERY_PAYLOAD_MUST_BE_OBJECT'],
      strippedKeyCount: 0
    };
  }

  const rawRecord = rawInput as Record<string, unknown>;

  // 1. Audit for narrative epistemic firewall breaches
  const detectedNarrativeTags = detectBannedNarrativeTags(rawRecord);
  if (detectedNarrativeTags.length > 0) {
    return {
      valid: false,
      errors: [
        `NARRATIVE_TAGS_FORBIDDEN: Ingress rejected due to epistemic firewall breach: [${detectedNarrativeTags.join(', ')}]`
      ],
      strippedKeyCount: 0
    };
  }

  // 2. Validate against closed Zod discriminated union
  const parsed = SpatialQueryDiscriminatorSchema.safeParse(rawRecord);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
    );
    return {
      valid: false,
      errors,
      strippedKeyCount: 0
    };
  }

  const scrubbedQuery = deepFreeze(parsed.data) as ScrubbedSpatialQuery;

  return {
    valid: true,
    query: scrubbedQuery,
    errors: [],
    strippedKeyCount: 0
  };
}

/**
 * Strips non-schema properties from an object and returns only permitted keys.
 */
export function sanitizeLooseQueryInput(
  rawInput: Record<string, unknown>,
  allowedKeys: readonly string[]
): { sanitized: Record<string, unknown>; strippedCount: number } {
  const sanitized: Record<string, unknown> = {};
  let strippedCount = 0;

  for (const [key, value] of Object.entries(rawInput)) {
    if (allowedKeys.includes(key)) {
      sanitized[key] = value;
    } else {
      strippedCount++;
    }
  }

  return { sanitized, strippedCount };
}
