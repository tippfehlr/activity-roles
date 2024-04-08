import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

import { prepare, DBActivityRole, getLang } from '../db';
import { Command } from '../commandHandler';
import { __, discordTranslations } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('export')
    .setDescription('Exports all activity roles in your guild.')
    .setDescriptionLocalizations(discordTranslations('Lists all activity roles in your guild.'))
    .setDMPermission(false)
    .addBooleanOption(option =>
      option
        .setName('roleids')
        .setDescription('Show role IDs (can’t be imported in another guild)')
        .setDescriptionLocalizations(
          discordTranslations('Show role IDs (can’t be imported in another guild)'),
        )
        .setRequired(false),
    ),

  execute: async interaction => {
    const locale = getLang(interaction);
    const roleIDs = (interaction.options.get('roleids') as boolean | null) ?? false;

    const activityRoles: DBActivityRole[] = prepare(
      'SELECT * FROM activityRoles WHERE guildID = ?',
    ).all(interaction.guild!.id) as any as DBActivityRole[];
    if (activityRoles.length === 0) {
      interaction.reply({
        content: __({ phrase: 'There are no activity roles in this guild.', locale }),
      });
      return;
    }

    /*
    Import is: ActivityName,ExactActivityNaime,Permanent,RoleName,RoleColor, so we can import on another server
    */
    let output = '# ActivityName,\tmode,\tpermanent,\tRoleName,\tRoleColor';
    if (roleIDs) output += '\t# RoleID';
    output += '\n\n';

    for (const activityRole of activityRoles) {
      const role = interaction.guild!.roles.cache.find(role => role.id === activityRole.roleID);
      output +=
        activityRole.activityName +
        `,\t${activityRole.exactActivityName}` +
        `,\t${Number(!activityRole.live)}` +
        `,\t\t${role?.name}` +
        `,\t${role?.hexColor}`;
      if (roleIDs) output += `  \t# ${activityRole.roleID}`;
      output += '\n';
    }

    const filename = `export-${interaction.id.substring(0, 7)}.txt`;
    fs.writeFileSync(filename, output);
    await interaction.reply({
      files: [filename],
    });
    fs.unlinkSync(filename);
  },
} as Command;
