import Discord from 'discord.js';

import * as db from './db';
import config from '../../config';
import msg, { log } from './messages';
import CommandHandler from './commandHandler';

export const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_PRESENCES,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.DIRECT_MESSAGES
  ]
});

client.on('ready', () => {
  new CommandHandler(client);
  client.user?.setPresence({
    status: 'online',
    afk: false,
    activities: config.activities
  });
  msg.log.login(
    String(client.user?.username),
    String(client.user?.discriminator),
    String(client.user?.id)
  );
  db.setGuildCheckInterval(client);
});

const processingUser = new Map<string, boolean>();
client.on('presenceUpdate', async (oldMember, newMember) => {
  await newMember.member?.fetch();
  if (!newMember?.user || !newMember.guild || !newMember.member) return;
  if (newMember.member.user.bot) return;
  if (processingUser.has(newMember.user?.id)) return;
  processingUser.set(newMember.user?.id, true);
  await db.checkGuild(newMember.guild);
  await db.checkUser(newMember.user);

  for (const activity of newMember.activities) {
    if (activity.name !== 'Custom Status') {
      const docs = await db.UserData.findOne({
        userID: newMember.user.id,
        activityName: activity.name
      }).lean();

      if (!docs) {
        new db.UserData({
          userID: newMember.user?.id,
          activityName: activity.name,
          autoRole: true,
          ignored: false
        }).save();
        msg.log.newActivity(
          newMember.user.username,
          newMember.user.id,
          newMember.guild.name,
          newMember.guild.id,
          activity.name
        );
      }
    }
  }
  processingUser.delete(newMember.user?.id);
  db.checkRoles(newMember.member);
});

client.on('guildCreate', guild => {
  log.info(`Joined guild ${guild.name} (${guild.id})`);
  db.checkGuild(guild);
});

client.on('guildDelete', guild => log.info(`Left guild ${guild.name} (${guild.id})`));

client.on('disconnect', () => {
  log.warn('The Discord WebSocket has closed and will no longer attempt to reconnect');
});

client.on('error', error => log.error(error, 'The Discord WebSocket has encountered an error'));

client.on('roleDelete', async role => {
  const guildRole = (await db.GuildData.findOne({
    roleID: role.id,
    guildID: role.guild.id
  })) as db.GuildDataType;
  const res = await db.GuildData.deleteMany({ roleID: role.id, guildID: role.guild.id });
  if (res.deletedCount > 0) {
    msg.log.addRemoveActivityRole(
      role.guild.name,
      role.guild.id,
      role.name,
      role.id,
      guildRole.activityName,
      guildRole.exactActivityName,
      guildRole.live,
      false,
      true
    );
    const guildConfig = (await db.GuildConfig.findOne({
      _id: role.guild.id
    }).lean()) as db.GuildConfigType;
    const logChannel = role.guild.channels.cache.find(
      channel => channel.id === guildConfig.logChannelID
    );
    if (logChannel && logChannel.isText()) {
      logChannel.send({
        embeds: [
          msg.logChannel.forceDeletedActivityRole(
            guildRole.activityName,
            role.id,
            guildRole.exactActivityName,
            guildRole.live
          )
        ]
      });
    }
  }
});

export function connect() {
  return client.login(config.TOKEN);
}
