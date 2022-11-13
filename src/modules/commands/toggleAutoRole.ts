import { getUserAutoRole, db } from './../db';
import { Command } from '../commandHandler';

import msg from '../messages';
import { SlashCommandBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('toggleautorole')
    .setDescription('Enable/Disable automatic role assignment')
    .addBooleanOption(option =>
      option
        .setName('enabled')
        .setDescription('Enable/Disable automatic role assignment')
        .setRequired(false)
    ),

  execute: async interaction => {
    const autoRole = interaction.options.get('enabled', false)?.value as boolean | undefined;
    const userAutoRole = getUserAutoRole(interaction.user.id);
    if (autoRole === undefined) {
      interaction.reply({ embeds: [msg.userStatus(userAutoRole)] });
    } else {
      db.prepare('UPDATE users SET autoRole = ? WHERE userId = ?').run(
        Number(autoRole),
        interaction.user.id
      );
      interaction.reply({ embeds: [msg.modifiedAutoRole(autoRole)] });
    }
  }
} as Command;
