import { prepare, getLang, getUserConfig } from './../db';
import { Command } from '../commandHandler';

import { __, __h_dc } from '../messages';
import { Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('toggleautorole')
    .setDescription('Enable/Disable automatic role assignment')
    .setDescriptionLocalizations(__h_dc('Enable/Disable automatic role assignment'))
    .addBooleanOption(option =>
      option
        .setName('enabled')
        .setDescription('Enable/Disable automatic role assignment')
        .setDescriptionLocalizations(__h_dc('Enable/Disable automatic role assignment'))
        .setRequired(false)
    ),

  execute: async interaction => {
    const locale = getLang(interaction);

    const autoRole = interaction.options.get('enabled', false)?.value as boolean | undefined;
    const userAutoRole = getUserConfig(interaction.user.id).autoRole;
    if (autoRole === undefined) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(__({ phrase: 'User Status', locale }))
            .setDescription(
              __(
                {
                  phrase:
                    'The bot is currently **%s** for this user.\n\nYou can change this with the command `/toggleAutoRole`.',
                  locale
                },
                userAutoRole
                  ? __({ phrase: 'enabled', locale })
                  : __({ phrase: 'disabled', locale })
              )
            )
            .setColor(userAutoRole ? Colors.Green : Colors.Red)
        ]
      });
    } else {
      prepare('UPDATE users SET autoRole = ? WHERE userIDHash = ?').run(
        Number(autoRole),
        interaction.user.id
      );
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              __(
                { phrase: 'Automatic role assignment for your user is now **%s**.', locale },
                autoRole ? __({ phrase: 'enabled', locale }) : __({ phrase: 'disabled', locale })
              )
            )
            .setDescription(
              __({ phrase: 'You can change this with the command `/toggleAutoRole`.', locale })
            )
            .setColor(autoRole ? Colors.Green : Colors.Red)
        ]
      });
    }
  }
} as Command;
