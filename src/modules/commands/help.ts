import { commandHandler } from './../bot';
import { Command } from '../commandHandler';

import config from '../../../config';
import msg from '../messages';
import { MessageEmbed } from 'discord.js';

export default {
  name: 'help',
  category: 'Help',
  description: 'Shows the help menu',

  testOnly: config.debug,

  callback: async interaction => {
    const commandEmbed = new MessageEmbed().setTitle('Commands').setColor(config.botColor);
    commandHandler.commands.forEach(command => {
      let commandName = `**\`/${command.name}`;
      command.options?.forEach(option => {
        // @ts-ignore
        if (option.required) {
          commandName += ` <${option.name}>`;
        } else {
          commandName += ` [${option.name}]`;
        }
      });
      commandName += `\`**`;

      let commandDescription = command.description;
      // if (command.requiredPermissions) {
      //   commandDescription += `\nRequired Permissions: ${command.requiredPermissions
      //     .map(permission => `\`${permission}\``)
      //     .join(', ')}`;
      // }
      // if (command.guildOnly) {
      //   commandDescription += '\nCan only be used in a guild';
      // }
      command.options?.forEach(option => {
        commandDescription += `\`\n${option.name}\`: ${option.description}`;
      });
      commandEmbed.addField(commandName, commandDescription);
    });
    interaction.reply({ embeds: [msg.help.helpEmbed(), commandEmbed] });
  }
} as Command;
