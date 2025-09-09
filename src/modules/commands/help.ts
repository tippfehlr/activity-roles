// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Command } from '../commandHandler';

import config from '.././config';
import { __, discordTranslations } from '../messages';
import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { getLang } from '../db';

export default {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescriptionLocalizations(discordTranslations('help->description:Shows the help page'))
		.setContexts([
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel,
		])
		.setDescription(__({ phrase: 'help->description', locale: 'en-US' })),

	execute: async interaction => {
		const locale = getLang(interaction);

		interaction.reply({
			files: ['./img/discord-header.png'],
			embeds: [
				new EmbedBuilder()
					.setColor(config.COLOR)
					.setDescription(
						__(
							{
								phrase: 'help->reply-description',
								locale,
							},
							{
								support: 'https://discord.gg/3K9Yx4ufN7',
								github: 'https://github.com/tippfehlr/activity-roles/',
								contact: '@tippfehlr | tippfehlr@tippfehlr.dev',
							},
						),
					)
					.setFooter({
						text: __({ phrase: 'help->reply-footer', locale }),
						iconURL: config.AUTHOR_LOGO_LINK,
					}),
			],
		});
	},
} as Command;
