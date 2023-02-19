import { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';

import { db, DBActivityStats, getLang } from '../db';
import { Command } from '../commandHandler';
import config from '../config';
import { __, __h_dc } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('activitystats')
    .setDescription('Shows a list of activities in this guild.')
    .setDescriptionLocalizations(__h_dc('Shows a list of activities in this guild.'))
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

  execute: async interaction => {
    const locale = getLang(interaction);

    const activityStats = db
      .prepare('SELECT * FROM activityStats WHERE guildID = ?')
      .all(interaction.guildId!) as DBActivityStats[];

    if (activityStats.length === 0) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(__({ phrase: 'No activity stats found.', locale }))
            .setColor(config.COLOR)
        ]
      });
    } else {
      activityStats.sort((a, b) => {
        return b.count - a.count;
      });
      let activities = '';
      for (const activity of activityStats) {
        activities += activity.activityName + '\n';
      }
      fs.writeFileSync('activities.txt', activities);
      await interaction.reply({
        content: __({ phrase: 'Activities (sorted by frequency):', locale }),
        files: ['activities.txt']
      });
      fs.unlinkSync('activities.txt');
    }
  }
} as Command;
