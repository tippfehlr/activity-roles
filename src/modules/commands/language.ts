import { __h_dc, locales, localesMap } from './../messages';
import { Locale, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../commandHandler';
import { prepare, getGuildConfig, getLang, getUserConfig } from '../db';
import { __ } from '../messages';
import config from '../config';
import { createHash } from 'crypto';

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
              ...locales.map(locale => {
                return { name: localesMap[locale], value: locale };
              }),
            ),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('sets the language for the user. Overwrites the guild language.')
        .setDescriptionLocalizations(
          __h_dc('sets the language for the user. Overwrites the guild language.'),
        )
        .addStringOption(option =>
          option
            .setName('language')
            .setDescription('The language to set the bot to')
            .setRequired(false)
            .addChoices(
              { name: 'Undefined', value: 'none' },
              ...locales.map(locale => {
                return { name: localesMap[locale], value: locale };
              }),
            ),
        ),
    ),
  execute: async interaction => {
    let locale = getLang(interaction);
    //@ts-ignore: getSubcommand() is not defined in the typings
    const subcommand = interaction.options.getSubcommand() as 'guild' | 'user';
    const newLanguage = interaction.options.get('language')?.value as Locale | 'none' | undefined;

    if (subcommand === 'guild') {
      if (!interaction.guild) {
        interaction.reply({
          content: __({ phrase: 'You can only set the guild language in a guild!', locale }),
          ephemeral: true,
        });
        return;
      }

      const guildLanguage = getGuildConfig(interaction.guild.id).language;
      if (!newLanguage) {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(__({ phrase: 'Languages', locale }))
              .setDescription(
                __(
                  { phrase: 'The current guild language is **`%s`**.', locale },
                  localesMap[guildLanguage],
                ) +
                  '\n\n' +
                  __(
                    {
                      phrase:
                        'If you want to help translating the bot, you can do so at %s. Thanks!',
                      locale,
                    },
                    'https://crowdin.com/project/activity-roles',
                  ),
              )
              .setColor(config.COLOR),
          ],
        }); //TODO reply with language list with percentages and link to crowdin and credits.
        return;
      }

      if (!interaction.memberPermissions?.has('ManageRoles')) {
        interaction.reply({
          content: __({
            phrase: 'You need the `manage roles` permission to set the guild language.',
            locale,
          }),
          ephemeral: true,
        });
        return;
      }
      if (guildLanguage === newLanguage) {
        interaction.reply({
          content:
            __(
              { phrase: 'The language is already set to **`%s`**.', locale },
              localesMap[newLanguage],
            ) +
            '\n\n' +
            __({
              phrase:
                'The language of the command names and description is managed by your Discord language.',
              locale,
            }),
          ephemeral: true,
        });
        return;
      }
      prepare('UPDATE guilds SET language = ? WHERE guildID = ?').run(
        newLanguage,
        interaction.guild.id,
      );
      locale = getLang(interaction);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              __({ phrase: 'Guild language set to **`%s`**', locale }, localesMap[newLanguage]),
            )
            .setColor(config.COLOR),
        ],
        ephemeral: true,
      });
    } else if (subcommand === 'user') {
      const userLanguage = getUserConfig(interaction.user.id).language;
      if (!newLanguage) {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(__({ phrase: 'Languages', locale }))
              .setDescription(
                __(
                  { phrase: 'The current user language is **`%s`**.%s', locale },
                  localesMap[userLanguage] || __({ phrase: 'undefined', locale }),
                  userLanguage === 'none'
                    ? __({ phrase: ' The guild language will be used.', locale })
                    : '',
                ) +
                  '\n\n' +
                  __({
                    phrase:
                      'The language of the command names and description is managed by your Discord language.',
                    locale,
                  }) +
                  '\n\n' +
                  __(
                    {
                      phrase:
                        'If you want to help translating the bot, you can do so at %s. Thanks!',
                      locale,
                    },
                    'https://crowdin.com/project/activity-roles',
                  ),
              )
              .setColor(config.COLOR),
          ],
        }); //TODO reply with language list with percentages and link to crowdin and credits.
        return;
      }

      if (getUserConfig(interaction.user.id).language === newLanguage) {
        interaction.reply({
          content:
            __(
              { phrase: 'The language is already set to **`%s`**.%s', locale },
              localesMap[newLanguage] || 'undefined',
              newLanguage === 'none'
                ? __({ phrase: ' The guild language will be used.', locale })
                : '',
            ) +
            '\n\n' +
            __({
              phrase:
                'The language of the command names and description is managed by your Discord language.',
              locale,
            }),
          ephemeral: true,
        });
        return;
      }
      prepare('UPDATE users SET language = ? WHERE userIDHash = ?').run(
        newLanguage,
        createHash('sha256').update(interaction.user.id).digest('base64'),
      );
      locale = getLang(interaction);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              __(
                { phrase: 'User language set to **`%s`**.%s', locale },
                localesMap[newLanguage] || 'undefined',
                newLanguage === 'none'
                  ? __({ phrase: ' The guild language will be used.', locale })
                  : '',
              ) +
                '\n\n' +
                __({
                  phrase:
                    'The language of the command names and description is managed by your Discord language.',
                  locale,
                }),
            )
            .setColor(config.COLOR),
        ],
        ephemeral: true,
      });
    }
  },
} as Command;
