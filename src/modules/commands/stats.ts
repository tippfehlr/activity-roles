// SPDX-License-Identifier: AGPL-3.0-only

import { EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import config from '../config';
import { Command } from '../commandHandler';
import { getLang, getRowCount, getUserCount } from '../db';
import { i18n, __, discordTranslations } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows some stats about the bot.')
    .setDescriptionLocalizations(discordTranslations('Shows some stats about the bot.'))
    .setContexts([
      InteractionContextType.BotDM,
      InteractionContextType.Guild,
      InteractionContextType.PrivateChannel,
    ]),
  execute: async interaction => {
    const locale = getLang(interaction);

    interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(config.COLOR).setDescription(
          __(
            {
              phrase: 'The bot currently serves **%s** and manages **%s** and **%s** for **%s**.',
              locale,
            },
            i18n.__n({
              singular: '%s guild',
              plural: '%s guilds',
              locale,
              count: interaction.client.guilds.cache.size,
            }),
            i18n.__n({
              singular: '%s activity role',
              plural: '%s activity roles',
              locale,
              count: await getRowCount('activityRoles'),
            }),
            i18n.__n({
              singular: '%s status role',
              plural: '%s status roles',
              locale,
              count: await getRowCount('statusRoles'),
            }),
            i18n.__n({
              singular: '%s user',
              plural: '%s users',
              locale,
              count: await getUserCount(),
            }),
          ),
        ),
      ],
    });
  },
} as Command;
