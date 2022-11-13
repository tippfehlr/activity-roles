import { commandHandler } from './../bot';
import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription('Shows the help menu'),

  execute: async interaction => {
    const commandEmbed = new EmbedBuilder().setTitle('Commands').setColor(config.botColor);
    commandHandler.commands.forEach(command => {
      let commandName = `**\`/${command.data.name}`;
      command.data.options.forEach(option => {
        // @ts-ignore
        if (option.required) {
          commandName += ` <${option.toJSON().name}>`;
        } else {
          commandName += ` [${option.toJSON().name}]`;
        }
      });
      commandName += `\`**`;

      let commandDescription = command.data.description;
      // if (command.requiredPermissions) {
      //   commandDescription += `\nRequired Permissions: ${command.requiredPermissions
      //     .map(permission => `\`${permission}\``)
      //     .join(', ')}`;
      // }
      // if (command.guildOnly) {
      //   commandDescription += '\nCan only be used in a guild';
      // }
      command.data.options.forEach(option => {
        commandDescription += `\`\n${option.toJSON().name}\`: ${option.toJSON().description}`;
      });
      commandEmbed.addFields({ name: commandName, value: commandDescription });
    });
    interaction.reply({
      files: ['./img/discord-header.png'],
      embeds: [msg.helpEmbed(), commandEmbed]
    });
  }
} as Command;
