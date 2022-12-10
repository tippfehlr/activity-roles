import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import config from '../../../config';
import { Command } from '../commandHandler';
import { db, getLang } from '../db';
import { i18n, __, __h_dc } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows some stats about the bot.')
    .setDescriptionLocalizations(__h_dc('Shows some stats about the bot.')),
  execute: async interaction => {
    const locale = getLang(interaction);

    interaction.reply({
      embeds: [
        new EmbedBuilder().setColor(config.botColor).setDescription(
          __(
            { phrase: 'The bot currently serves **%s** and manages **%s** for **%s**.', locale },
            i18n.__n({
              singular: '%s guild',
              plural: '%s guilds',
              locale,
              count: interaction.client.guilds.cache.size
            }),
            i18n.__n({
              singular: '%s role',
              plural: '%s roles',
              locale,
              count: db.prepare('SELECT COUNT(*) FROM activityRoles').get()['COUNT(*)']
            }),
            i18n.__n({
              singular: '%s user',
              plural: '%s users',
              locale,
              count: db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)']
            })
          )
        )
      ]
    });
  }
} as Command;
