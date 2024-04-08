import { pino } from 'pino';
import { I18n } from 'i18n';

export const locales = ['en-US', 'cs', 'nl', 'pt-BR', 'de', 'ru', 'uk', 'et-EE', 'fr'];

// Estonian is not supported by discord and therefore can’t be used for command descriptions.
const discordNotSupported = ['et-EE'];

// as long as all locales from const locales are defined here, this is safe.
export const localesMap: { [locale: string]: string } = {
  'en-US': 'American English',
  cs: 'Čeština (Czech)',
  nl: 'Nederlands (Dutch)',
  'pt-BR': 'Português do Brasil (Brazilian Portuguese)',
  de: 'Deutsch (German)',
  ru: 'Русский (Russian)',
  uk: 'Укра (Ukrainian)',
  'et-EE': 'Eesti (Estonian)',
  fr: 'Français (French)',
};

export const i18n = new I18n({
  locales,
  directory: __dirname + '/../../locales',
  defaultLocale: 'en-US',
  indent: '  ',
});
export const __ = i18n.__;

export function discordTranslations(s: string) {
  let dcTranslations: { [key: string]: string } = {};

  i18n.__h(s).forEach(language => {
    if (!discordNotSupported.includes(Object.keys(language)[0])) {
      dcTranslations = { ...dcTranslations, ...language };
    }
  });
  return dcTranslations;
}

export function getEnumKey<TEnumKey extends string, TEnumVal>(
  myEnum: { [key in TEnumKey]: TEnumVal },
  enumValue: TEnumVal,
): string {
  return Object.keys(myEnum)[Object.values(myEnum).indexOf(enumValue as unknown as TEnumVal)];
}

export const log = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'YYYY-mm-dd HH:MM:ss.l',
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});
