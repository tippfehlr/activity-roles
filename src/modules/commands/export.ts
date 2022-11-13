import { SlashCommandBuilder, PermissionsBitField, CommandInteraction } from 'discord.js';
import { db, ActivityRoles } from './../db';
import fs from 'fs';
import config from '../../../config';
import { Command } from '../commandHandler';

export default {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Exports all game roles in your guild as a JSON file.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false),
  execute: async (interaction: CommandInteraction) => {
    const activityRoles: ActivityRoles[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id);
    const array = [];
    for (const activityRole of activityRoles) {
      array.push({
        guildID: activityRole.guildID,
        roleID: activityRole.roleID,
        activityName: activityRole.activityName,
        live: Boolean(activityRole.live),
        exactActivityName: Boolean(activityRole.exactActivityName)
      });
    }
    fs.writeFileSync(config.exportFileName, JSON.stringify(array, null, 1));
    await interaction.reply({ files: [config.exportFileName] });
    fs.unlinkSync(config.exportFileName);
  }
} as Command;
