import Discord from 'discord.js';
import mongoose from 'mongoose';

import config from '../../config';
import messages from './messages';

async function connect(uri: string) {
  await mongoose.connect(uri).then(() => {
    messages.log.mongodbConnect();
  });
}

import UserConfig from './models/userConfig';
import GuildConfig from './models/guildConfig';
import GuildData from './models/guildData';
import UserData from './models/userData';

// @param guild: Discord guild object
async function checkGuild(guild: Discord.Guild): Promise<void> {
  messages.log.activity();
  if (!await GuildConfig.findById(guild.id.toString()).select('_id').lean()) {
    const channel = await guild.channels.create('game-roles-v2');
    channel.send({ embeds: [messages.newLogChannel()] })
    new GuildConfig({
      _id: guild.id.toString(),
      logChannelID: channel.id.toString()
    }).save();
    messages.log.addGuild(guild.name, guild.id.toString());
  }
}

// @param user: Discord user object
// @return: User existed before check
async function checkUser(user: Discord.User): Promise<boolean> {
  messages.log.activity();
  if (!await UserConfig.findById(user.id.toString()).exec()) {
    await new UserConfig({
      _id: user.id.toString(),
      autoRole: true
    }).save();
    messages.log.addUser(user.username, user.id.toString());
    return false;
  }
  return true;
}

// @param member: Discord member object
async function checkRoles(member: Discord.GuildMember) {
  messages.log.activity();
  if (member.user.bot) return;
  await checkUser(member.user);
  await checkGuild(member.guild);
  const doc = await UserConfig.findById(member.user.id.toString());
  if (!doc.autoRole) return;

  const guildActivityList = await GuildData.find({ guildID: member.guild.id.toString() }).lean();
  const userActivityList = await UserData.find({ userID: member.user.id.toString() }).lean();
  const highestBotRole = member?.guild?.me?.roles.highest.position;
  if (highestBotRole === undefined) {
    messages.error.highestBotRoleUndefined(member.guild.name, member.guild.id);
    return;
  }

  for (const guildActivity of guildActivityList) {
    this_role: {
      const userHasRole: boolean = member.roles.cache.has(guildActivity.roleID);
      let role = member.guild.roles.cache.find(_role => _role.id === guildActivity.roleID);
      if (role === undefined) break this_role; //FIXME: What if role gets removed?

      // eslint-disable-next-line no-var
      var userShouldHaveRole = false;
      if (guildActivity.exactActivityName) {
        userActivities: {
          const userActivityListFiltered = userActivityList.filter((elmt: { activityName: string }) => elmt.activityName === guildActivity.activityName);
          for (const y in userActivityListFiltered) {
            if (userActivityListFiltered[y]) {
              if (!userActivityListFiltered[y].ignored && userActivityListFiltered[y].autoRole) {
                userShouldHaveRole = true;
                break userActivities;
              }
            }
          }
        }
      } else {
        userActivities: {
          for (const y in userActivityList) {
            if (userActivityList[y].activityName.includes(guildActivity.activityName)) {
              if (!userActivityList[y].ignored && userActivityList[y].autoRole) {
                userShouldHaveRole = true;
                break userActivities;
              }
            }
          }
        }
        
      }

      if (userShouldHaveRole && !userHasRole) { // add role to member
        if (role.position < highestBotRole) {
          member.roles.add(role);
          messages.log.addedRoleToMember(role.name, guildActivity.roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
        } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
          const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
          const channel = member.guild.channels.cache.find(_channel => _channel.id === _guildConfig.logChannelID && _channel.isText()) as Discord.TextChannel;
          if (channel) { //TODO: Check for permissions
            messages.log.errorCantAssignRole(role.name, role.id, role.position, member.user.username, member.user.id, guildActivity.activityName, highestBotRole);
            channel.send({ embeds: [messages.errorCantAssignRole(role.id, role.position, member.user.id, guildActivity.activityName, highestBotRole)] });
          }
        }
      } else if (!userShouldHaveRole && userHasRole) { // remove role from member
        if (role.position < highestBotRole) {
          member.roles.remove(role);
          messages.log.removedRoleFromMember(role.name, guildActivity.roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
        } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
          const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
          const channel = member.guild.channels.cache.find(_channel => _channel.id === _guildConfig.logChannelID && _channel.isText()) as Discord.TextChannel;
          if (channel) {
            messages.log.errorCantRemoveRole(role.name, role.id, role.position, member.user.username, member.user.id, guildActivity.activityName, highestBotRole);
            channel.send({ embeds: [messages.errorCantRemoveRole(role.id, role.position, member.user.id, guildActivity.activityName, highestBotRole)] });
          }
        }
      }
    }
  }
}

async function checkAllRoles(guild: Discord.Guild) {
  messages.log.activity();
  await checkGuild(guild);

  const guildActivityList = await GuildData.find({ guildID: guild.id.toString() }).lean();
  const highestBotRole: number | undefined = guild?.me?.roles.highest.position;
  if (highestBotRole === undefined) return;

  guild.members.cache.forEach(async (member) => {
    user: {
      if (member.user.bot)
        break user;
      await checkUser(member.user);

      const doc = await UserConfig.findById(member.user.id.toString());
      if (!doc.autoRole)
        break user;

      const userActivityList = await UserData.find({ userID: member.user.id.toString() }).lean();

      for (const x in guildActivityList) {
        this_role: {
          const userHasRole: boolean = member.roles.cache.has(guildActivityList[x].roleID);
          let role: Discord.Role | undefined = member.guild.roles.cache.find(_role => _role.id === guildActivityList[x].roleID);
          if (role === undefined) {
            break this_role; //FIXME: What if role gets removed?
          } else {
            role = role as Discord.Role;
          }
          var userShouldHaveRole = false;
          userActivities: {
            if (guildActivityList[x].only_included_allowed) {
              for (const y in userActivityList) {
                if (userActivityList[y].activityName.includes(guildActivityList[x].activityName)) {
                  if (!userActivityList[y].ignored && userActivityList[y].autoRole) {
                    userShouldHaveRole = true;
                    break userActivities;
                  }
                }
              }
            } else {
              const userActivityListFiltered = userActivityList.filter((elmt: { activityName: string }) => elmt.activityName === guildActivityList[x].activityName);
              for (const y in userActivityListFiltered) {
                if (userActivityListFiltered[y]) {
                  if (!userActivityListFiltered[y].ignored && userActivityListFiltered[y].autoRole) {
                    userShouldHaveRole = true;
                    break userActivities;
                  }
                }
              }
            }
          }

          if (userShouldHaveRole && !userHasRole) { // add role to member
            if (role.position < highestBotRole) {
              member.roles.add(role);
              messages.log.addedRoleToMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
            } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
              const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
              const logChannelID = _guildConfig.logChannelID;
              const channel = guild.channels.cache.find(_channel => _channel.id === _guildConfig.logChannelID && _channel.isText()) as Discord.TextChannel;
              if (channel) {
                messages.log.errorCantAssignRole(role.name, role.id, role.position, member.user.username, member.user.id, guildActivityList[x].activityName, highestBotRole);
                channel.send({ embeds: [messages.errorCantAssignRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole)] });
              }
            }
          } else if (!userShouldHaveRole && userHasRole) { // remove role from member
            if (role.position < highestBotRole) {
              member.roles.remove(role);
              messages.log.removedRoleFromMember(role.name, guildActivityList[x].roleID, member.user.username, member.user.id, member.guild.name, member.guild.id);
            } else if ('logChannelID' in await GuildConfig.findById(member.guild.id.toString()).lean()) {
              const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
              const logChannelID = _guildConfig.logChannelID;
              const channel = guild.channels.cache.find(_channel => _channel.id === _guildConfig.logChannelID && _channel.isText()) as Discord.TextChannel;
              if (channel) {
                messages.log.errorCantRemoveRole(role.name, role.id, role.position, member.user.username, member.user.id, guildActivityList[x].activityName, highestBotRole);
                channel.send({ embeds: [messages.errorCantRemoveRole(role.id, role.position, member.user.id, guildActivityList[x].activityName, highestBotRole)] });
              }
            }
          }
        }
      }
    }
  });
}

export default {
  connect,
  checkGuild,
  checkUser,
  checkRoles,
  checkAllRoles,

  UserConfig,
  UserData,
  GuildConfig,
  GuildData
}
