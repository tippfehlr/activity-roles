// SPDX-License-Identifier: AGPL-3.0-only

import { db, getLang } from './../db';
import { Command } from '../commandHandler';

import { __, discordTranslations, getEnumKey } from '../messages';
import {
	ActivityType,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	PermissionsBitField,
	SlashCommandBuilder,
} from 'discord.js';
export default {
	data: new SlashCommandBuilder()
		.setName('deletestatusrole')
		.setDescription(__({ phrase: 'deleteStatusRole->description', locale: 'en-US' }))
		.setDescriptionLocalizations(discordTranslations('deleteStatusRole->description'))
		.setContexts([InteractionContextType.Guild])
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.addStringOption(option =>
			option
				.setName('event')
				.setDescription(
					__({ phrase: 'deleteStatusRole->eventOptionDescription', locale: 'en-US' }),
				)
				.setDescriptionLocalizations(
					discordTranslations('deleteStatusRole->eventOptionDescription'),
				)
				.setChoices(
					{
						name: 'Playing',
						name_localizations: discordTranslations('Playing'),
						value: '0',
					}, // value 0
					{
						name: 'Streaming',
						name_localizations: discordTranslations('Streaming'),
						value: '1',
					}, // value 1
					{
						name: 'Listening',
						name_localizations: discordTranslations('Listening'),
						value: '2',
					}, // value 2
					{
						name: 'Watching',
						name_localizations: discordTranslations('Watching'),
						value: '3',
					}, // value 3
					{
						name: 'Custom',
						name_localizations: discordTranslations('Custom'),
						value: '4',
					}, // value 4
					{
						name: 'Competing',
						name_localizations: discordTranslations('Competing'),
						value: '5',
					}, // value 5
				)
				.setRequired(true),
		),
	execute: async interaction => {
		if (!interaction.guildId) return;
		const locale = getLang(interaction);
		const type = Number(interaction.options.get('event')?.value) as number;
		const typeString = getEnumKey(ActivityType, type);
		const currentStatusRole = await db
			.selectFrom('statusRoles')
			.selectAll()
			.where('guildID', '=', interaction.guildId)
			.where('type', '=', type)
			.executeTakeFirst();

		if (currentStatusRole) {
			await db
				.deleteFrom('statusRoles')
				.where('guildID', '=', interaction.guildId)
				.where('type', '=', type)
				.execute();
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							__(
								{ phrase: 'deleteStatusRole->success', locale },
								'`' + typeString + '`',
							),
						)
						.setColor(Colors.Green),
				],
			});
		} else {
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							__(
								{ phrase: 'deleteStatusRole->noStatusRole', locale },
								'`' + typeString + '`',
							),
						)
						.setColor(Colors.Red),
				],
			});
		}
	},
} as Command;
