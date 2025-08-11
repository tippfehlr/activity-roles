// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db, getLang } from './../db';
import { Command } from '../commandHandler';

import { __, discordTranslations, getEnumKey } from '../messages';
import {
	ActivityType,
	APIRole,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
	Role,
	SlashCommandBuilder,
} from 'discord.js';
export default {
	data: new SlashCommandBuilder()
		.setName('setstatusrole')
		.setDescription('role to assign on LISTENING/WATCHING/etc.')
		.setDescriptionLocalizations(
			discordTranslations('role to assign on LISTENING/WATCHING/etc.'),
		)
		.setContexts([InteractionContextType.Guild])
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.addStringOption(option =>
			option
				.setName('event')
				.setDescription('the event the user must have to receive the role')
				.setDescriptionLocalizations(
					discordTranslations('the event the user must have to receive the role'),
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
		)
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('the role to assign. To remove the role, omit this option')
				.setDescriptionLocalizations(
					discordTranslations('the role to assign. To remove the role, omit this option'),
				)
				.setRequired(true),
		),

	execute: async interaction => {
		if (!interaction.guildId) return;
		const locale = getLang(interaction);
		const type = Number(interaction.options.get('event')?.value) as number;
		const typeString = getEnumKey(ActivityType, type);
		const role = interaction.options.get('role')?.role as Role | APIRole;
		const currentStatusRole = await db
			.selectFrom('statusRoles')
			.selectAll()
			.where('guildID', '=', interaction.guildId)
			.where('type', '=', type)
			.executeTakeFirst();

		if (role.name === '@everyone') {
			interaction.reply(
				':x:' + __({ phrase: 'setStatusRole->roleNotValid', locale }, `<@&${role.id}>`),
			);
			return;
		}

		if (currentStatusRole && role.id === currentStatusRole.roleID) {
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							__(
								{
									phrase: 'the status role for **%s** already is <@&%s>!',
									locale,
								},
								typeString,
								role.id,
							),
						)
						.setColor(Colors.Green),
				],
				flags: MessageFlags.Ephemeral,
			});
		} else {
			db.insertInto('statusRoles')
				.values({
					guildID: interaction.guildId,
					type,
					roleID: role.id,
				})
				.onConflict(oc => oc.columns(['type', 'guildID']).doUpdateSet({ roleID: role.id }))
				.execute();
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(
							__(
								{ phrase: 'The status role for **%s** is now <@&%s>!', locale },
								typeString,
								role.id,
							),
						)
						.setColor(Colors.Green),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
} as Command;
