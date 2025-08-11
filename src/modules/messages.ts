// SPDX-License-Identifier: AGPL-3.0-only

import pino from 'pino';
import { I18n } from 'i18n';
import { Locale } from 'discord.js';

export const localesMap: { [locale: string]: string } = {
	'en-US': 'American English',
	cs: 'Čeština (Czech)',
	nl: 'Nederlands (Dutch)',
	'pt-BR': 'Português do Brasil (Brazilian Portuguese)',
	de: 'Deutsch (German)',
	ru: 'Русский (Russian)',
	uk: 'Укра (Ukrainian)',
	fr: 'Français (French)',
};
export const locales = Object.keys(localesMap);

export function discordTranslations(s: string) {
	let dcTranslations: { [key: string]: string } = {};

	i18n.__h(s).forEach(language => {
		dcTranslations = { ...dcTranslations, ...language };
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
			translateTime: 'SYS:standard',
		},
	},
	level: process.env.LOG_LEVEL || 'info',
});

export const i18n = new I18n({
	locales,
	directory: __dirname + '/../../locales',
	defaultLocale: 'en-US',
	indent: '  ',
	objectNotation: '->',
	logDebugFn: m => log.debug(m),
	logErrorFn: m => log.error(m),
	logWarnFn: m => log.warn(m),
});
export const __ = i18n.__;
export const __n = i18n.__n;

export function i18nifyBoolean(b: boolean, locale: string): string {
	return b ? __({ phrase: 'Yes', locale }) : __({ phrase: 'No', locale });
}
