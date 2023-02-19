import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

import { db, DBActivityRole, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, __h_dc } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Exports all activity roles in your guild.')
    .setDescriptionLocalizations(__h_dc('Lists all activity roles in your guild.'))
    .setDMPermission(false)
    .addBooleanOption(option =>
      option
        .setName('roleids')
        .setDescription('Show role IDs (can’t be imported in another guild)')
        .setDescriptionLocalizations(__h_dc('Show role IDs (can’t be imported in another guild)'))
        .setRequired(false)
    ),

  execute: async interaction => {
    const locale = getLang(interaction);
    const roleIDs = (interaction.options.get('roleids') as boolean | null) ?? false;

    const activityRoles: DBActivityRole[] = db
      .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
      .all(interaction.guild!.id);
    if (activityRoles.length === 0) {
      interaction.reply({
        content: __({ phrase: 'There are no activity roles in this guild.', locale })
      });
      return;
    }

    /*
    Import is: ActivityName,ExactActivityNaime,Live,RoleName,RoleColor, so we can import on another server
    */
    let output = '# ActivityName,\tmode,\ttemporary,\tRoleName,\tRoleColor';
    if (roleIDs) output += '\t# RoleID';
    output += '\n\n';

    for (const activityRole of activityRoles) {
      const role = interaction.guild!.roles.cache.find(role => role.id === activityRole.roleID);
      output +=
        activityRole.activityName +
        `,\t${activityRole.exactActivityName}` +
        `,\t${activityRole.live}` +
        `,\t\t${role?.name}` +
        `,\t${role?.hexColor}`;
      if (roleIDs) output += `  \t# ${activityRole.roleID}`;
      output += '\n';
    }

    const filename = interaction.id.substring(0, 7) + '.txt';
    fs.writeFileSync(filename, output);
    await interaction.reply({
      files: [filename]
    });
    fs.unlinkSync(filename);
  }
} as Command;
