import type { Locale } from './i18n'

/**
 * Welcome SMS templates. {name} is interpolated.
 * TR uses GSM-7 + Turkish shift table → 1 segment. All others are Unicode → plan for 2 segments.
 * Tone: warm, personal, reflective — addressing the recipient informally where the target language allows.
 */
const WELCOME_SMS: Record<Locale, string> = {
  tr: `Sevgili {name}, iki yıl boyunca atılan her adım bugünü hazırladı. Sapphire Momentum II'de seni aramızda görmek çok değerli.`,

  en: `Dear {name}, every step taken over these two years has led to this day. Having you with us at Sapphire Momentum II means so much.`,

  ru: `{name}, каждый шаг этих двух лет привёл к сегодняшнему дню. Видеть тебя среди нас на Sapphire Momentum II — для нас по-настоящему ценно.`,

  bg: `{name}, всяка стъпка през тези две години доведе до днес. Да те видим с нас на Sapphire Momentum II е изключително ценно.`,

  it: `{name}, ogni passo di questi due anni ha portato a oggi. Averti con noi a Sapphire Momentum II significa moltissimo.`,

  mn: `Эрхэм {name}, өнгөрсөн хоёр жилд хийсэн алхам бүр өнөөдрийг бэлдсэн. Таныг Sapphire Momentum II-д бидний дунд харах нь үнэхээр үнэ цэнэтэй.`,
}

export function buildWelcomeSms(locale: Locale, name: string): string {
  return WELCOME_SMS[locale].replace('{name}', name)
}
