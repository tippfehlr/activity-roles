// SPDX-License-Identifier: AGPL-3.0-only

import {
  SlashCommandBuilder,
  PermissionsBitField,
  CommandInteraction,
  InteractionContextType,
} from 'discord.js';
import { db, getGuildConfig, getLang } from './../db';
import { Command } from '../commandHandler';
import { __, discordTranslations } from '../messages';

export default {
  data: new SlashCommandBuilder()
    .setName('requirerole')
    .setDescription(__({ phrase: 'requireRole->description', locale: 'en-US' }))
    .setDescriptionLocalizations(discordTranslations('requireRole->description'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setContexts([InteractionContextType.Guild])
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(__({ phrase: 'requireRole->roleOptionDescription', locale: 'en-US' }))
        .setDescriptionLocalizations(discordTranslations('requireRole->roleOptionDescription')),
    ),
  execute: async (interaction: CommandInteraction) => {
    const locale = getLang(interaction);
    const role = interaction.options.get('role')?.role;
    const guildConfig = await getGuildConfig(interaction.guildId!);

    if (!role || role.name === '@everyone') {
      if (guildConfig.requiredRoleID) {
        await db
          .updateTable('guilds')
          .set({ requiredRoleID: null })
          .where('guildID', '=', interaction.guildId!)
          .execute();
        interaction.reply({
          content: ':white_check_mark: ' + __({ phrase: 'requireRole->successRemove', locale }),
          ephemeral: true,
        });
      } else {
        interaction.reply({
          content: ':x: ' + __({ phrase: 'requireRole->failedNoRequiredRole', locale }),
        });
      }
    } else {
      if (role.id === guildConfig.requiredRoleID) {
        interaction.reply({
          content: ':x: ' + __({ phrase: 'requireRole->roleAlreadySet', locale }),
          ephemeral: true,
        });
      } else {
        await db
          .updateTable('guilds')
          .set({ requiredRoleID: role.id })
          .where('guildID', '=', interaction.guildId!)
          .execute();
        interaction.reply({
          content:
            ':white_check_mark: ' + __({ phrase: 'requireRole->success', locale }, `<&${role.id}>`),
          ephemeral: true,
        });
      }
    }
  },
} as Command;
