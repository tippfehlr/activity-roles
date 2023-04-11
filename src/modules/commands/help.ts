import { commandHandler } from './../bot';
import { Command } from '../commandHandler';

import config from '.././config';
import { __, __h_dc } from '../messages';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setNameLocalizations(__h_dc('help'))
    .setDescription('Shows the help menu')
    .setDescriptionLocalizations(__h_dc('Shows the help menu')),

  execute: async interaction => {
    const locale = getLang(interaction);

    const commandEmbed = new EmbedBuilder()
      .setTitle(__({ phrase: 'Commands', locale }))
      .setColor(config.COLOR);
    commandHandler.commands.forEach(command => {
      let commandName = `**\`/${command.data.name}`;
      command.data.options.forEach(option => {
        if (option.toJSON().required) {
          commandName += ` <${option.toJSON().name}>`;
        } else {
          commandName += ` [${option.toJSON().name}]`;
        }
      });
      commandName += `\`**`;

      let commandDescription = command.data.description_localizations
        ? command.data.description_localizations[locale]
        : command.data.description;
      // if (command.requiredPermissions) {
      //   commandDescription += `\nRequired Permissions: ${command.requiredPermissions
      //     .map(permission => `\`${permission}\``)
      //     .join(', ')}`;
      // }
      // if (command.guildOnly) {
      //   commandDescription += '\nCan only be used in a guild';
      // }
      command.data.options.forEach(option => {
        const option_description_localization = option.toJSON().description_localizations;
        const option_name_localization = option.toJSON().name_localizations;
        commandDescription += `\`\n${option_name_localization ? option_name_localization[locale] : option.toJSON().name
          }\`: ${option_description_localization
            ? option_description_localization[locale]
            : option.toJSON().description
          }`;
      });
      //@ts-ignore
      commandEmbed.addFields({ name: commandName, value: commandDescription });
    });
    interaction.reply({
      files: ['./img/discord-header.png'],
      embeds: [
        new EmbedBuilder()
          .setColor(config.COLOR)
          .setFooter({
            // = Made and hosted by <author>.
            // or
            // = Made by <author> and hosted by <host>
            text:
              config.AUTHOR === config.HOSTER_NAME
                ? __({ phrase: 'Made and hosted by %s', locale }, config.AUTHOR)
                : __({ phrase: 'Made by %s and hosted by %s', locale }, config.AUTHOR, config.HOSTER_NAME),
            iconURL: config.AUTHOR_LOGO_LINK
          })
          .setDescription(
            __({
              phrase: 'A Discord bot for automatic role assignment based on activities.\n',
              locale
            }) +
            __({ phrase: 'Support/Suggestions: %s\n', locale }, 'https://discord.gg/3K9Yx4ufN7') +
            __(
              { phrase: 'GitHub: %s\n', locale },
              'https://github.com/tippf3hlr/activity-roles/'
            ) +
            __({ phrase: 'Contact: %s\n\n', locale }, 'tippfehlr#3575 | tippfehlr@gmail.com') +
            __({
              phrase:
                'If you add an activity role with `/addactivityrole`, the bot will start looking for activities with the specified name. If a user starts an activity with that name, the bot will add the role to the user.\n',
              locale
            }) +
            __({
              phrase:
                'If `exact_activity_name` is set to false, the activity name `Chrome` would also trigger for `Google Chrome`.\n',
              locale
            }) +
            __({
              phrase: 'If it is true, the activity must match exactly and case-sensitively.\n',
              locale
            }) +
            __({
              phrase:
                "If you set `live` to true, the bot will remove the role from users who got the role from the bot and don't have the activity anymore.\n",
              locale
            }) +
            __({
              phrase: '**The bot will not remove any roles that were added manually.**',
              locale
            })
          )
          .addFields({
            name: __({ phrase: 'Thanks', locale }),
            value: __(
              { phrase: '%s\nIf I forgot you, please let me know!', locale },
              '@EianLee#7234, @Krampus#2007 **[Brasilian Portuguese]**, @RstY_CZ#2033 **[Czech]**, @dangerBEclose#1654 **[Dutch]**, @skyykc#0218, @Mann#9999, Hugo Moreira#4306, Tillmann Taute **[German]**, ZamestoTV **[Russian]**, onepunch#0001 **[Ukrainian]**'
            )
          }),
        commandEmbed
      ]
    });
  }
} as Command;
