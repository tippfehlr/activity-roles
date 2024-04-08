import { DBStatusRole, prepare, getLang } from './../db';
import { Command } from '../commandHandler';

import { __, discordTranslations, getEnumKey } from '../messages';
import { ActivityType, Colors, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('setstatusrole')
    .setDescription('role to assign on LISTENING/WATCHING/etc.')
    .setDescriptionLocalizations(discordTranslations('role to assign on LISTENING/WATCHING/etc.'))
    .addStringOption(option =>
      option
        .setName('event')
        .setDescription('the event the user must have to receive the role')
        .setDescriptionLocalizations(
          discordTranslations('the event the user must have to receive the role'),
        )
        .setChoices(
          { name: 'Playing', name_localizations: discordTranslations('Playing'), value: '0' }, // value 0
          { name: 'Streaming', name_localizations: discordTranslations('Streaming'), value: '1' }, // value 1
          { name: 'Listening', name_localizations: discordTranslations('Listening'), value: '2' }, // value 2
          { name: 'Watching', name_localizations: discordTranslations('Watching'), value: '3' }, // value 3
          { name: 'Custom', name_localizations: discordTranslations('Custom'), value: '4' }, // value 4
          { name: 'Competing', name_localizations: discordTranslations('Competing'), value: '5' }, // value 5
        )
        .setRequired(true),
    )
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('the role to assign. To remove the role, omit this option')
        .setDescriptionLocalizations(
          discordTranslations('the role to assign. To remove the role, omit this option'),
        ),
    ),

  execute: async interaction => {
    const locale = getLang(interaction);
    const type = Number(interaction.options.get('event')?.value) as number;
    const typeString = getEnumKey(ActivityType, type);
    const role = interaction.options.get('role')?.role;
    const currentStatusRole = prepare(
      'SELECT * FROM statusRoles WHERE guildID = ? and type = ?',
    ).get(interaction.guildId, type) as DBStatusRole | undefined;

    if (role) {
      if (currentStatusRole && role.id === currentStatusRole.roleID) {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __(
                  {
                    phrase: 'the status role for **%s** already is <@&%s>!',
                    locale,
                  },
                  typeString,
                  role.id,
                ),
              )
              .setColor(Colors.Green),
          ],
          ephemeral: true,
        });
      } else {
        if (currentStatusRole) {
          prepare('UPDATE statusRoles SET roleID = ? WHERE guildID = ? AND type = ? ').run(
            role.id,
            interaction.guildId,
            type,
          );
        } else {
          prepare('INSERT INTO statusRoles (guildID, type, roleID) VALUES (?, ?, ?)').run(
            interaction.guildId,
            type,
            role.id,
          );
        }
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __(
                  {
                    phrase: 'The status role for **%s** is now <@&%s>!',
                    locale,
                  },
                  typeString,
                  role.id,
                ),
              )
              .setColor(Colors.Green),
          ],
          ephemeral: true,
        });
      }
    } else {
      if (currentStatusRole) {
        prepare('DELETE FROM statusRoles WHERE guildID = ? AND type = ?').run(
          interaction.guildId,
          type,
        );
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __({ phrase: 'The status role for **%s** has been deleted.', locale }, typeString),
              )
              .setColor(Colors.Red),
          ],
          ephemeral: true,
        });
      } else {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription(
                __({ phrase: 'There is no status role set for **%s**', locale }, typeString),
              )
              .setColor(Colors.Red),
          ],
          ephemeral: true,
        });
      }
    }
  },
} as Command;
