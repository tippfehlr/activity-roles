import { pino } from 'pino';

import { I18n } from 'i18n';

enum locale { 'en-US', 'cs', 'nl', 'pt-BR', 'de', 'ru', 'uk', 'et-EE' }
export type Locale = keyof typeof locale;
export const locales: Locale[] = Object.keys(locale).filter(item => isNaN(Number(item))) as unknown as Locale[];

// Estonian is not supported by discord and therefore can’t be used for command descriptions.
enum discordLocale { 'en-US', 'cs', 'nl', 'pt-BR', 'de', 'ru', 'uk' }
export type DiscordLocale = keyof typeof discordLocale;
export const discordLocales: DiscordLocale[] = Object.keys(discordLocale).filter(item => isNaN(Number(item))) as unknown as DiscordLocale[];

// as long as all locales from const locales are defined here, this is safe.
export const localesMap: { [locale: string]: string } = {
  'en-US': 'American English',
  cs: 'Čeština (Czech)',
  nl: 'Nederlands (Dutch)',
  'pt-BR': 'Português do Brasil (Brazilian Portuguese)',
  de: 'Deutsch (German)',
  ru: 'Русский (Russian)',
  uk: 'Укра (Ukrainian)',
  'et-EE': 'Eesti (Estonian)'
}

export const i18n = new I18n({
  locales,
  directory: __dirname + '/../../locales',
  defaultLocale: 'en-US',
  indent: '  '
});
export const __ = i18n.__;

export const __h_dc = (s: string) => {
  let dcTranslations: { [locale in DiscordLocale]?: string } = {};
  i18n.__h(s).forEach(language => {
    // language: { [locale: string]: string}
    if (discordLocales.includes(Object.keys(language)[0] as DiscordLocale)) {
      dcTranslations = { ...dcTranslations, ...language };
    }
  });
  return dcTranslations;
};

export function getEnumKey<TEnumKey extends string, TEnumVal>(
  myEnum: { [key in TEnumKey]: TEnumVal },
  enumValue: TEnumVal
): string {
  return Object.keys(myEnum)[Object.values(myEnum).indexOf(enumValue as unknown as TEnumVal)];
}

export const log = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l'
    }
  }
});
