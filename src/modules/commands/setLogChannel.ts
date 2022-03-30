import { ICallbackObject, ICommand } from 'wokcommands';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  names: 'setLogChannel',
  category: 'Configuration',
  description:
    'Sets a different log channel for the bot. If nothing provided, sets the current channel.',
  requiredPermissions: ['MANAGE_ROLES'],

  slash: true,
  testOnly: config.debug,
  guildOnly: true,
  options: [
    {
      name: 'channel',
      description: 'The channel to set as the log channel.',
      required: false,
      type: 'CHANNEL'
    }
  ],

  callback: async command => {
    msg.log.command();
    let channel: Discord.GuildBasedChannel | undefined;
    if (command.args[0]) channel = command?.guild?.channels.cache.get(command.args[0]);
    if (command.args[0] && !channel) {
      command.interaction.reply({ content: msg.channelDoesNotExist(), ephemeral: true });
      return;
    }
    if (!channel) {
      changeLogChannel(command, command.channel);
    } else {
      changeLogChannel(command, channel);
    }
  }
} as ICommand;

async function changeLogChannel(
  command: ICallbackObject,
  channel: Discord.GuildBasedChannel
): Promise<void> {
  const currentLogChannel: db.GuildConfigType | null = await db.GuildConfig.findById(
    command.guild?.id
  );
  if (currentLogChannel?.logChannelID === channel.id) {
    command.interaction.reply({ embeds: [msg.alreadyIsLogChannel()], ephemeral: true });
    return;
  }
  await db.GuildConfig.updateOne({ _id: command.guild?.id }, { logChannelID: channel.id });
  command.interaction.reply({ embeds: [msg.logChannelSet(channel)], ephemeral: true });
  return;
}
