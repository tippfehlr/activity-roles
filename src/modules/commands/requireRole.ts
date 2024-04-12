import {
  SlashCommandBuilder,
  PermissionsBitField,
  CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { db, getGuildConfig, getLang } from './../db';
import { Command } from '../commandHandler';
import { __, discordTranslations } from '../messages';
import config from '../config';

export default {
  data: new SlashCommandBuilder()
    .setName('requirerole')
    .setDescription('Require users to have this role in order to receive Activity Roles.')
    .setDescriptionLocalizations(
      discordTranslations('Require users to have this role in order to receive Activity Roles.'),
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .setDMPermission(false)
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription(
          'The role to require. To get the current role, omit this. To reset, enter @everyone.',
        )
        .setDescriptionLocalizations(
          discordTranslations(
            'The role to require. To get the current role, omit this. To reset, enter @everyone.',
          ),
        ),
    ),
  execute: async (interaction: CommandInteraction) => {
    const locale = getLang(interaction);
    const role = interaction.options.get('role')?.role;
    const guildConfig = await getGuildConfig(interaction.guildId!);

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
                    : `<@&${guildConfig.requiredRoleID}>`,
                ),
              )
              .setColor(config.COLOR),
          ],
        });
      } else {
        db.updateTable('guilds')
          .set({
            requiredRoleID: role.id === interaction.guild?.roles.everyone.id ? null : role.id,
          })
          .where('guildID', '=', interaction.guildId!)
          .execute();
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __(
                  {
                    phrase: 'Users now need to have %s in order to receive Activity Roles.',
                    locale,
                  },
                  role.id === interaction.guild?.roles.everyone.id ? '@everyone' : `<@&${role.id}>`,
                ),
              )
              .setColor(config.COLOR),
          ],
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
                  : `<@&${guildConfig.requiredRoleID}>`,
              ),
            )
            .setColor(config.COLOR),
        ],
      });
    }
  },
} as Command;
