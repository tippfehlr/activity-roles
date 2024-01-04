import { commandHandler } from './../bot';
import { Command } from '../commandHandler';

import config from '.././config';
import { __, __h_dc } from '../messages';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
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

      command.data.options.forEach(option => {
        const name_localizations = option.toJSON().name_localizations;
        const description_localizations = option.toJSON().description_localizations;
        const name = name_localizations ? name_localizations[locale] : option.toJSON().name;
        const description = description_localizations ? description_localizations[locale] : option.toJSON().description
        commandDescription += `\n\`${name}\`: ${description}`;
      });

      commandEmbed.addFields({ name: commandName, value: commandDescription! });
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
            __({ phrase: 'A Discord bot for automatic role assignment based on activities.\n', locale }) +
            __({ phrase: 'Support/Suggestions: %s\n', locale }, 'https://discord.gg/3K9Yx4ufN7') +
            __({ phrase: 'GitHub: %s\n', locale }, 'https://github.com/tippf3hlr/activity-roles/') +
            __({ phrase: 'Contact: %s\n\n', locale }, '@tippfehlr | tippfehlr@gmail.com') +
            __({
              phrase:
                'If you add an activity role with `/addactivityrole`, ' +
                'the bot will start looking for activities with the specified name. ' +
                'If a user starts an activity with that name, ' +
                'the bot will add the role to the user.\n',
              locale
            }) +
            __({
              phrase:
                'If `exact_activity_name` is set to false, the activity ' +
                'name `Chrome` would also trigger for `Google Chrome`.\n',
              locale
            }) +
            __({ phrase: 'If it is true, the activity must match exactly and case-sensitively.\n', locale }) +
            __({
              phrase:
                'If you set `live` to true, the bot will remove the ' +
                'role from users who got the role from the bot and ' +
                " don't have the activity anymore.\n",
              locale
            }) +
            __({ phrase: '**The bot will not remove any roles that were added manually.**', locale })
          ),
        commandEmbed
      ]
    });
  }
} as Command;
