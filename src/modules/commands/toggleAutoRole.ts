// SPDX-License-Identifier: AGPL-3.0-only

import { db, getLang, getUserConfig } from './../db';
import { Command } from '../commandHandler';

import { __, discordTranslations } from '../messages';
import { Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('toggleautorole')
    .setDescription('Enable/Disable automatic role assignment')
    .setDescriptionLocalizations(discordTranslations('Enable/Disable automatic role assignment'))
    .addBooleanOption(option =>
      option
        .setName('enabled')
        .setDescription('Enable/Disable automatic role assignment')
        .setDescriptionLocalizations(
          discordTranslations('Enable/Disable automatic role assignment'),
        )
        .setRequired(false),
    ),

  execute: async interaction => {
    const locale = getLang(interaction);

    const autorole = interaction.options.get('enabled', false)?.value as boolean | undefined;
    const userAutorole = (await getUserConfig(interaction.user.id)).autorole;
    if (autorole === undefined) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(__({ phrase: 'User Status', locale }))
            .setDescription(
              __(
                {
                  phrase:
                    'The bot is currently **%s** for this user.\n\nYou can change this with the command `/toggleAutoRole`.',
                  locale,
                },
                userAutorole
                  ? __({ phrase: 'enabled', locale })
                  : __({ phrase: 'disabled', locale }),
              ),
            )
            .setColor(userAutorole ? Colors.Green : Colors.Red),
        ],
      });
    } else {
      db.updateTable('users').set({ autorole }).where('userID', '=', interaction.user.id).execute();
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              __(
                { phrase: 'Automatic role assignment for your user is now **%s**.', locale },
                autorole ? __({ phrase: 'enabled', locale }) : __({ phrase: 'disabled', locale }),
              ),
            )
            .setDescription(
              __({ phrase: 'You can change this with the command `/toggleAutoRole`.', locale }),
            )
            .setColor(autorole ? Colors.Green : Colors.Red),
        ],
      });
    }
  },
} as Command;
