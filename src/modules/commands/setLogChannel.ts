import { Command, CommandInteraction } from '../commandHandler';
import Discord from 'discord.js';

import config from '../../../config';
import msg from '../messages';
import * as db from '../db';

export default {
  name: 'setlogchannel',
  category: 'Configuration',
  description:
    'Sets a different log channel for the bot. If nothing provided, sets the current channel.',
  requiredPermissions: ['MANAGE_ROLES'],

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

  callback: async interaction => {
    await interaction.deferReply({ ephemeral: true });
    msg.log.command();
    const channel = interaction.options.getChannel('channel');
    if (channel) {
      if (channel?.type === 'GUILD_TEXT') {
        changeLogChannel(interaction, channel);
      } else {
        interaction.editReply({ embeds: [msg.noTextChannel(channel.id)] });
      }
    } else {
      if (interaction.channel) changeLogChannel(interaction, interaction.channel);
    }
  }
} as Command;

async function changeLogChannel(
  interaction: CommandInteraction,
  channel: Discord.TextBasedChannel
): Promise<void> {
  const currentLogChannel: db.GuildConfigType | null = await db.GuildConfig.findById(
    interaction.guild!.id
  );
  if (currentLogChannel?.logChannelID === channel.id) {
    interaction.editReply({ embeds: [msg.alreadyIsLogChannel()] });
    return;
  }
  await db.GuildConfig.updateOne({ _id: interaction.guild!.id }, { logChannelID: channel.id });
  interaction.editReply({ embeds: [msg.logChannelSet(channel)] });
  channel.send({ embeds: [msg.newLogChannel()] });
  return;
}
