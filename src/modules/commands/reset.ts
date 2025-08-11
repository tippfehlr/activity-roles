// SPDX-License-Identifier: AGPL-3.0-only

import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
	ComponentType,
	InteractionContextType,
	MessageFlags,
	PermissionsBitField,
	SlashCommandBuilder,
} from 'discord.js';

import { Command } from '../commandHandler';
import { __, discordTranslations } from '../messages';
import { db, getLang } from '../db';

export default {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription(__({ phrase: 'reset->description', locale: 'en-US' }))
		.setDescriptionLocalizations(discordTranslations('reset->description'))
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
		.setContexts([InteractionContextType.Guild]),

	execute: async interaction => {
		const locale = getLang(interaction);
		// the command cannot be used in DMs anyways
		if (
			!interaction.channel ||
			interaction.channel.type === ChannelType.GroupDM ||
			interaction.channel.type === ChannelType.DM
		) {
			return;
		}

		await interaction.reply({
			content: __({ phrase: 'reset->confirmationPrompt', locale }),
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId('reset:confirm')
						.setLabel(__({ phrase: 'Yes', locale }))
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder()
						.setCustomId('reset:cancel')
						.setLabel(__({ phrase: 'No', locale }))
						.setStyle(ButtonStyle.Secondary),
				),
			],
			flags: MessageFlags.Ephemeral,
		});

		interaction.channel
			.createMessageComponentCollector({
				componentType: ComponentType.Button,
				filter: (btnInt: ButtonInteraction) => interaction.user.id === btnInt.user.id,
				max: 1,
				time: 3 * 60 * 1000,
			})
			.on('collect', async (int: ButtonInteraction) => {
				switch (int.customId) {
					case 'reset:confirm':
						await int.deferUpdate();
						await db
							.deleteFrom('activityRoles')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await db
							.deleteFrom('activityStats')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await db
							.deleteFrom('guilds')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await db
							.deleteFrom('statusRoles')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await db
							.deleteFrom('activeTemporaryRoles')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await db
							.deleteFrom('activeTemporaryRolesHashed')
							.where('guildID', '=', interaction.guildId)
							.execute();
						await int.editReply({
							content: __({ phrase: 'Success!', locale }),
							components: [],
						});
						break;
					case 'reset:cancel':
						int.update({
							content: __({ phrase: 'Cancelled', locale }),
							components: [],
						});
						break;
				}
			});
	},
} as Command;
