// SPDX-License-Identifier: AGPL-3.0-only

import {
	PermissionsBitField,
	SlashCommandBuilder,
	EmbedBuilder,
	InteractionContextType,
} from 'discord.js';
import fs from 'fs';

import { getLang, db } from '../db';
import { Command } from '../commandHandler';
import config from '../config';
import { __, discordTranslations } from '../messages';

export default {
	data: new SlashCommandBuilder()
		.setName('activitystats')
		.setDescription('Shows a list of activities in this guild.')
		.setDescriptionLocalizations(
			discordTranslations('Shows a list of activities in this guild.'),
		)
		.setContexts([InteractionContextType.Guild])
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

	execute: async interaction => {
		const locale = getLang(interaction);

		const activityStats = await db
			.selectFrom('activityStats')
			.selectAll()
			.where('guildID', '=', interaction.guildId!)
			.execute();

		if (activityStats.length === 0) {
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(__({ phrase: 'No activity stats found.', locale }))
						.setColor(config.COLOR),
				],
			});
		} else {
			activityStats.sort((a, b) => {
				return b.count - a.count;
			});
			let activities = '';
			for (const activity of activityStats) {
				activities += activity.activityName + '\n';
			}
			const filename = `activities-${interaction.id.substring(0, 7)}.txt`;
			fs.writeFileSync(filename, activities);
			await interaction.reply({
				content: __({ phrase: 'Activities (sorted by frequency):', locale }),
				files: [filename],
			});
			fs.unlinkSync(filename);
		}
	},
} as Command;
