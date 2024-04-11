import { Command } from '../commandHandler';

import config from '.././config';
import { __, discordTranslations } from '../messages';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { getLang } from '../db';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows the help menu')
    .setDescriptionLocalizations(discordTranslations('help->description:Shows the help menu')),

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
          .setDescription(
            __(
              {
                phrase: `help->reply-description:A Discord bot for automatic role assignment based on activities.
Support/Suggestions: {{{support}}}
GitHub: {{{github}}}
Contact: {{{contact}}}

Add an activity role with \`/addactivityrole\`. By default, the bot will remove the role again when the activity ends.
If \`permanent\` is set to true, the bot will not remove the role.
If \`exact_activity_name\` is true, the bot will only accept exact matches.
Set a status role with \`/setstatusrole\`!
**The bot will not remove any roles that were added manually.**

I don’t use the bot myself. If you want to speed up development or help me pay for the server, please consider supporting me.
{{{sponsor_links}}}
`,
                locale,
              },
              {
                support: 'https://discord.gg/3K9Yx4ufN7',
                github: 'https://github.com/tippfehlr/activity-roles/',
                contact: '@tippfehlr | tippfehlr@gmail.com',
                sponsor_links: 'https://github.com/sponsors/tippfehlr\nhttps://ko-fi.com/Z8Z7SYDDJ',
              },
            ),
          )
          .setFooter({
            text: __({ phrase: 'help->reply-footer:Made by tippfehlr', locale }),
            iconURL: config.AUTHOR_LOGO_LINK,
          }),
        // commandEmbed
      ],
    });
  },
} as Command;
