import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../commandHandler';
import { db } from '../db';
import msg from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Shows some stats about the bot.'),
  execute: async interaction => {
    interaction.reply({
      embeds: [
        msg.statsEmbed(
          interaction.client.guilds.cache.size,
          db.prepare('SELECT COUNT(*) FROM activityRoles').get()['COUNT(*)'],
          db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)']
        )
      ]
    });
  }
} as Command;
