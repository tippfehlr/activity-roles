import {
  SlashCommandBuilder,
  PermissionsBitField,
  CommandInteraction,
  EmbedBuilder
} from 'discord.js';
import { prepare, getGuildConfig, getLang } from './../db';
import { Command } from '../commandHandler';
import { __, __h_dc } from '../messages';
import config from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('requirerole')
    .setDescription('Require users to have this role in order to receive Activity Roles.')
    .setDescriptionLocalizations(
      __h_dc('Require users to have this role in order to receive Activity Roles.')
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false)
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(
          'The role to require. To get the current role, omit this. To reset, enter @everyone.'
        )
        .setDescriptionLocalizations(
          __h_dc(
            'The role to require. To get the current role, omit this. To reset, enter @everyone.'
          )
        )
    ),
  execute: async (interaction: CommandInteraction) => {
    const locale = getLang(interaction);
    const role = interaction.options.get('role')?.role;
    const guildConfig = getGuildConfig(interaction.guildId!);

    if (role) {
      if (
        role.id === guildConfig.requiredRoleID ||
        (role.id === interaction.guild?.roles.everyone.id && guildConfig.requiredRoleID === null)
      ) {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __(
                  { phrase: '%s is already set as the required role.', locale },
                  role.id === interaction.guild?.roles.everyone.id
                    ? '@everyone'
                    : `<@&${guildConfig.requiredRoleID}>`
                )
              )
              .setColor(config.COLOR)
          ]
        });
      } else {
        prepare('UPDATE guilds SET requiredRoleID = ? WHERE guildID = ?').run(
          role.id === interaction.guild?.roles.everyone.id ? null : role.id,
          interaction.guildId!
        );
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __(
                  {
                    phrase: 'Users now need to have %s in order to receive Activity Roles.',
                    locale
                  },
                  role.id === interaction.guild?.roles.everyone.id ? '@everyone' : `<@&${role.id}>`
                )
              )
              .setColor(config.COLOR)
          ]
        });
      }
    } else {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              __(
                { phrase: 'Users need to have %s in order to receive Activity Roles.', locale },
                guildConfig.requiredRoleID === null
                  ? '@everyone'
                  : `<@&${guildConfig.requiredRoleID}>`
              )
            )
            .setColor(config.COLOR)
        ]
      });
    }
  }
} as Command;
