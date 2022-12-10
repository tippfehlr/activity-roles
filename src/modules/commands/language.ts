import { getEnumKey, i18n, __h_dc } from './../messages';
import { Locale, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../commandHandler';
import { db, getGuildConfig, getLang, getUserConfig } from '../db';
import { __ } from '../messages';
import config from '../../../config';

export default {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('Sets the language of the bot')
    .setDescriptionLocalizations(__h_dc('Sets the language of the bot'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('guild')
        .setDescription('sets the language for the guild')
        .setDescriptionLocalizations(__h_dc('sets the language for the guild'))
        .addStringOption(option =>
          option
            .setName('language')
            .setDescription('The language to set the bot to')
            .setRequired(false)
            .addChoices(
              ...i18n.getLocales().map(locale => {
                return { name: getEnumKey(Locale, locale), value: locale };
              })
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('sets the language for the user. Overwrites the guild language.')
        .setDescriptionLocalizations(
          __h_dc('sets the language for the user. Overwrites the guild language.')
        )
        .addStringOption(option =>
          option
            .setName('language')
            .setDescription('The language to set the bot to')
            .setRequired(false)
            .addChoices(
              { name: 'Default', value: 'none' },
              ...i18n.getLocales().map(locale => {
                return { name: getEnumKey(Locale, locale), value: locale };
              })
            )
        )
    ),
  execute: async interaction => {
    const locale = getLang(interaction);

    const language = interaction.options.get('language')?.value as string | undefined;
    if (!language) {
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(__({ phrase: 'Languages', locale }))
            .setDescription(
              __(
                {
                  phrase: 'If you want to help translating the bot, you can do so at %s. Thanks!',
                  locale
                },
                'https://crowdin.com/project/activity-roles'
              )
            )
            .setColor(config.botColor)
        ]
      }); //TODO reply with language list with percentages and link to crowdin and credits.
      return;
    }

    //@ts-ignore: getSubcommand() is not defined in the typings
    const subcommand = interaction.options.getSubcommand() as 'guild' | 'user';

    if (subcommand === 'guild') {
      if (!interaction.guild) {
        interaction.reply({
          content: __({ phrase: 'You can only set the guild language in a guild!', locale }),
          ephemeral: true
        });
        return;
      }
      if (!interaction.memberPermissions?.has('ManageRoles')) {
        interaction.reply({
          content: __({
            phrase: 'You need the `manage roles` permission to set the guild language.',
            locale
          }),
          ephemeral: true
        });
        return;
      }
      if (getGuildConfig(interaction.guild.id).language === language) {
        interaction.reply({
          content: __(
            { phrase: 'The language is already set to **`%s`**.', locale },
            getEnumKey(Locale, language)
          ),
          ephemeral: true
        });
        return;
      }
      db.prepare('UPDATE guilds SET language = ? WHERE guildID = ?').run(
        language,
        interaction.guild.id
      );
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              __({ phrase: 'Guild language set to **`%s`**', locale }, getEnumKey(Locale, language))
            )
            .setColor(config.botColor)
        ],
        ephemeral: true
      });
    } else if (subcommand === 'user') {
      if (getUserConfig(interaction.user.id).language === language) {
        interaction.reply({
          content: __(
            { phrase: 'The language is already set to **`%s`**.', locale },
            getEnumKey(Locale, language) || 'default'
          ),
          ephemeral: true
        });
        return;
      }
      db.prepare('UPDATE users SET language = ? WHERE userID = ?').run(
        language,
        interaction.user.id
      );
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              __(
                { phrase: 'User language set to **`%s`**', locale },
                getEnumKey(Locale, language) || 'default'
              )
            )
            .setColor(config.botColor)
        ],
        ephemeral: true
      });
    }
  }
} as Command;
