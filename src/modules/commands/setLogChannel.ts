import { db, GuildConfig } from './../db';
import { Command } from '../commandHandler';
import {
  CommandInteraction,
  TextBasedChannel,
  PermissionsBitField,
  ApplicationCommandOptionType,
  TextChannel
} from 'discord.js';

import config from '../../../config';
import msg from '../messages';

export default {
  name: 'setlogchannel',
  category: 'Configuration',
  description:
    'Sets a different log channel for the bot. If nothing provided, sets the current channel.',
  requiredPermissions: [PermissionsBitField.Flags.ManageRoles],

  testOnly: config.debug,
  guildOnly: true,
  options: [
    {
      name: 'channel',
      description: 'The channel to set as the log channel.',
      required: false,
      type: ApplicationCommandOptionType.Channel
    }
  ],

  callback: async interaction => {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.get('channel')?.channel;
    if (channel) {
      if (channel instanceof TextChannel) {
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
  channel: TextChannel | TextBasedChannel
): Promise<void> {
  const currentLogChannel: GuildConfig | null = db
    .prepare('SELECT * FROM guildConfig WHERE guildID = ?')
    .get(interaction.guild!.id);
  if (currentLogChannel?.logChannelID === channel.id) {
    interaction.editReply({ embeds: [msg.alreadyIsLogChannel()] });
    return;
  }
  db.prepare('UPDATE guildConfig SET logChannelID = ? WHERE guildID = ?').run(
    channel.id,
    interaction.guild!.id
  );
  interaction.editReply({ embeds: [msg.logChannelSet(channel)] });
  channel.send({ embeds: [msg.newLogChannel()] });
  return;
}
