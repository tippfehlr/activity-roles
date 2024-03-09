import { commandHandler } from './../bot';
import { Command } from '../commandHandler';

import config from '.././config';
import { DiscordLocale, __, __h_dc, discordLocales } from '../messages';
import { EmbedBuilder, SlashCommandBuilder, Locale as DiscordsLocale } from 'discord.js';
import { getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows the help menu')
    .setDescriptionLocalizations(__h_dc('Shows the help menu')),

  execute: async interaction => {
    const locale = getLang(interaction);

    // const commandEmbed = new EmbedBuilder()
    //   .setTitle(__({ phrase: 'Commands', locale }))
    //   .setColor(config.COLOR);
    // commandHandler.commands.forEach(command => {
    //   let commandName = `**\`/${command.data.name}`;
    //   command.data.options.forEach(option => {
    //     if (option.toJSON().required) {
    //       commandName += ` <${option.toJSON().name}>`;
    //     } else {
    //       commandName += ` [${option.toJSON().name}]`;
    //     }
    //   });
    //   commandName += `\`**`;
    //
    //   const discordLocale = discordLocales.includes(locale as DiscordLocale) ? locale as unknown as DiscordLocale : 'en-US';
    //
    //   let commandDescription = command.data.description_localizations
    //     ? command.data.description_localizations[discordLocale]
    //     : command.data.description;
    //
    //   command.data.options.forEach(option => {
    //     const name_localizations = option.toJSON().name_localizations;
    //     const description_localizations = option.toJSON().description_localizations;
    //     const name = name_localizations ? name_localizations[discordLocale] : option.toJSON().name;
    //     const description = description_localizations ? description_localizations[discordLocale as DiscordsLocale] : option.toJSON().description
    //     commandDescription += `\n\`${name}\`: ${description}`;
    //   });
    //
    //   commandEmbed.addFields({ name: commandName, value: commandDescription! });
    // });

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
                "Add an activity role with `/addactivityrole`. " +
                "By default, the bot will be removed when the user stops the activity.\n" +
                "If you set `permanent` to true, the bot will not remove the role.\n" +
                "`exact_activity_name` can be set to true if you get false-positives.\n",
              locale
            }) +
            __({ phrase: "Set a status role with /setstatusrole!\n", locale }) +
            __({ phrase: '**The bot will not remove any roles that were added manually.**', locale }) + "\n\n" +
            __({ phrase: "I don’t use the bot myself. If you want to speed up development or help me pay for the server, please consider supporting me.", locale }) + "\n" +
            "https://github.com/sponsors/tippfehlr\nhttps://ko-fi.com/Z8Z7SYDDJ"
          ),
        // commandEmbed
      ]
    });
  }
} as Command;
