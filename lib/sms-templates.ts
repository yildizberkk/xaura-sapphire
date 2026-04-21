import type { Locale } from './i18n'

/**
 * Welcome SMS templates. {name} is interpolated.
 * TR uses GSM-7 + Turkish shift table → 1 segment. All others are Unicode → plan for 2 segments.
 * Tone: warm, personal, reflective — addressing the recipient informally where the target language allows.
 */
const WELCOME_SMS: Record<Locale, string> = {
  tr: `Sevgili {name},\n\nİki yıl boyunca atılan her adım bugünü hazırladı.\nSapphire Momentum II'de seni aramızda görmek çok değerli.`,

  en: `Dear {name},\n\nEvery step taken over these two years has led to this day.\nHaving you with us at Sapphire Momentum II means so much.`,

  ru: `{name},\n\nКаждый шаг этих двух лет привёл к сегодняшнему дню.\nВидеть тебя среди нас на Sapphire Momentum II — для нас по-настоящему ценно.`,

  bg: `{name},\n\nВсяка стъпка през тези две години доведе до днес.\nДа те видим с нас на Sapphire Momentum II е изключително ценно.`,

  it: `{name},\n\nOgni passo di questi due anni ha portato a oggi.\nAverti con noi a Sapphire Momentum II significa moltissimo.`,

  mn: `Эрхэм {name},\n\nӨнгөрсөн хоёр жилд хийсэн алхам бүр өнөөдрийг бэлдсэн.\nТаныг Sapphire Momentum II-д бидний дунд харах нь үнэхээр үнэ цэнэтэй.`,
}

export function buildWelcomeSms(locale: Locale, name: string): string {
  return WELCOME_SMS[locale].replace('{name}', name)
}
