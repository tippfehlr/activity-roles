import { Locale } from 'discord.js';
import pino from 'pino';

import { I18n } from 'i18n';

export const i18n = new I18n({
  locales: ['en-US', 'cs'],
  directory: __dirname + '/../../locales',
  defaultLocale: 'en-US'
});
export const __ = i18n.__;

export const __h_dc = (s: string) => {
  let dcTranslations: { [locale in Locale]?: string } = {};
  i18n.__h(s).forEach(language => {
    dcTranslations = { ...dcTranslations, ...language };
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
