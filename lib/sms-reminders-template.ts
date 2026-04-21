export const DEFAULT_TEMPLATE =
  'Sevgili {name},\n\n{session} birazdan başlıyor.\nGörüşmek üzere.'

/** Maximum GSM-7 + Turkish shift-table segment size. */
export const MAX_SEGMENT_LENGTH = 160

export interface ResolveMessageInput {
  template: string
  firstName: string
  sessionTitle: string
}

export function resolveMessage(input: ResolveMessageInput): string {
  const name = input.firstName.trim()
  const session = input.sessionTitle.trim()
  return input.template.replace('{name}', name).replace('{session}', session)
}

export interface TemplateLengthResult {
  ok: boolean
  length: number
  reason?: string
}

export function validateTemplateLength(resolved: string): TemplateLengthResult {
  const length = resolved.length
  if (length > MAX_SEGMENT_LENGTH) {
    return {
      ok: false,
      length,
      reason: `Message is ${length} chars — exceeds 160-char single-segment limit`,
    }
  }
  return { ok: true, length }
}
