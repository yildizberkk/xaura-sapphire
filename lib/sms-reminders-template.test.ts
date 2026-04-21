import { describe, it, expect } from 'vitest'
import {
  resolveMessage,
  validateTemplateLength,
  DEFAULT_TEMPLATE,
} from './sms-reminders-template'

describe('resolveMessage', () => {
  it('substitutes {name} and {session} in the default template', () => {
    const msg = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: 'Berk',
      sessionTitle: 'Ruby Okulu',
    })
    expect(msg).toBe('Sevgili Berk, Ruby Okulu birazdan başlıyor. Görüşmek üzere.')
  })

  it('uses the session override when provided', () => {
    const msg = resolveMessage({
      template: 'Sevgili {name}, {session} başlıyor.',
      firstName: 'Ayşe',
      sessionTitle: 'Takdir Töreni',
    })
    expect(msg).toBe('Sevgili Ayşe, Takdir Töreni başlıyor.')
  })

  it('trims excess whitespace in names', () => {
    const msg = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: '  Berk  ',
      sessionTitle: 'Eğitim - 1',
    })
    expect(msg.includes(' Berk,')).toBe(true)
    expect(msg.includes('  Berk')).toBe(false)
  })
})

describe('validateTemplateLength', () => {
  it('accepts messages at or under 160 chars', () => {
    const result = validateTemplateLength('a'.repeat(160))
    expect(result.ok).toBe(true)
  })

  it('rejects messages over 160 chars', () => {
    const result = validateTemplateLength('a'.repeat(161))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/160/)
  })

  it('correctly measures resolved worst-case default template', () => {
    const worst = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: 'Aleksandra-Emmanuelle',
      sessionTitle: 'Sistem Kurmak: Sen Olmadan Çalışan Organizasyon',
    })
    const result = validateTemplateLength(worst)
    expect(result.ok).toBe(true)
  })
})
