import { SlashCommandBuilder, PermissionsBitField, CommandInteraction } from 'discord.js';
import { db, DBActivityRole } from './../db';
import fs from 'fs';
import { Command } from '../commandHandler';
import { __h_dc } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Exports all game roles in your guild as a JSON file.')
    .setDescriptionLocalizations(__h_dc('Exports all game roles in your guild as a JSON file.'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false),
  execute: async (interaction: CommandInteraction) => {
    const activityRoles: DBActivityRole[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id) as DBActivityRole[];
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
    fs.writeFileSync(interaction.id + '.txt', JSON.stringify(array, null, 1));
    await interaction.reply({ files: [interaction.id + '.txt'] });
    fs.unlinkSync(interaction.id + '.txt');
  }
} as Command;
