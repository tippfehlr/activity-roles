import Discord from 'discord.js';
import mongoose from 'mongoose';

import msg from './messages';

import { UserConfig } from './models/userConfig';
import { GuildConfig } from './models/guildConfig';
import { UserData } from './models/userData';
import { GuildData } from './models/guildData';

export { UserConfig, UserConfigType } from './models/userConfig';
export { GuildConfig, GuildConfigType } from './models/guildConfig';
export { UserData, UserDataType } from './models/userData';
export { GuildData, GuildDataType } from './models/guildData';

export async function connect(uri: string) {
  await mongoose.connect(uri).then(() => {
    msg.log.mongodbConnect();
  });
}

// @param guild: Discord guild object
export async function checkGuild(guild: Discord.Guild): Promise<void> {
  msg.log.activity();
  if (!(await GuildConfig.findById(guild.id.toString()).select('_id').lean())) {
    const channel = await guild.channels.create('game-roles-v2', {
      type: 'GUILD_TEXT'
    });
    channel.send({ embeds: [msg.newLogChannel()] });
    new GuildConfig({
      _id: guild.id.toString(),
      logChannelID: channel.id.toString()
    }).save();
    msg.log.addGuild(guild.name, guild.id.toString());
  }
}

// @param user: Discord user object
// @return: User existed before check
export async function checkUser(user: Discord.User): Promise<boolean> {
  msg.log.activity();
  if (!(await UserConfig.findById(user.id.toString()).exec())) {
    await new UserConfig({
      _id: user.id.toString(),
      autoRole: true
    }).save();
    msg.log.addUser(user.username, user.id.toString());
    return false;
  }
  return true;
}

// @param member: Discord member object
export async function checkRoles(member: Discord.GuildMember) {
  msg.log.activity();
  if (member.user.bot) return;
  await checkUser(member.user);
  await checkGuild(member.guild);
  const doc = await UserConfig.findById(member.user.id.toString());
  if (!doc.autoRole) return;

  const guildActivityList = await GuildData.find({
    guildID: member.guild.id.toString()
  }).lean();
  const userActivityList = await UserData.find({
    userID: member.user.id.toString()
  }).lean();
  const highestBotRole = member?.guild?.me?.roles.highest.position;
  if (highestBotRole === undefined) {
    msg.highestBotRoleUndefined(member.guild.name, member.guild.id);
    return;
  }

  for (const guildActivity of guildActivityList) {
    this_role: {
      const userHasRole: boolean = member.roles.cache.has(guildActivity.roleID);
      const role = member.guild.roles.cache.find(_role => _role.id === guildActivity.roleID);
      if (role === undefined) break this_role; //FIXME: What if role gets removed? -> add log message role not found

      let userShouldHaveRole = false;
      if (guildActivity.exactActivityName) {
        userActivities: {
          const userActivityListFiltered = userActivityList.filter(
            (elmt: { activityName: string }) => elmt.activityName === guildActivity.activityName
          );
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

      if (userShouldHaveRole && !userHasRole) {
        // add role to member
        if (role.position < highestBotRole) {
          member.roles.add(role);
          msg.log.addedRoleToMember(
            role.name,
            guildActivity.roleID,
            member.user.username,
            member.user.id,
            member.guild.name,
            member.guild.id
          );
        } else if (
          'logChannelID' in (await GuildConfig.findById(member.guild.id.toString()).lean())
        ) {
          const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
          const channel = member.guild.channels.cache.find(
            _channel => _channel.id === _guildConfig.logChannelID && _channel.isText()
          ) as Discord.TextChannel;
          msg.log.errorCantAssignRole(
            role.name,
            role.id,
            role.position,
            member.user.username,
            member.user.id,
            guildActivity.activityName,
            highestBotRole
          );
          if (
            channel &&
            channel.guild.me?.permissionsIn(channel).has(['SEND_MESSAGES', 'EMBED_LINKS'])
          ) {
            channel.send({
              embeds: [
                msg.errorCantAssignRole(
                  role.id,
                  role.position,
                  member.user.id,
                  guildActivity.activityName,
                  highestBotRole
                )
              ]
            });
          }
        }
      } else if (!userShouldHaveRole && userHasRole) {
        // remove role from member
        if (role.position < highestBotRole) {
          member.roles.remove(role);
          msg.log.removedRoleFromMember(
            role.name,
            guildActivity.roleID,
            member.user.username,
            member.user.id,
            member.guild.name,
            member.guild.id
          );
        } else if (
          'logChannelID' in (await GuildConfig.findById(member.guild.id.toString()).lean())
        ) {
          const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
          const channel = member.guild.channels.cache.find(
            _channel => _channel.id === _guildConfig.logChannelID && _channel.isText()
          ) as Discord.TextChannel;
          if (
            channel &&
            channel.guild.me?.permissionsIn(channel).has(['SEND_MESSAGES', 'EMBED_LINKS'])
          ) {
            msg.log.errorCantRemoveRole(
              role.name,
              role.id,
              role.position,
              member.user.username,
              member.user.id,
              guildActivity.activityName,
              highestBotRole
            );
            channel.send({
              embeds: [
                msg.errorCantRemoveRole(
                  role.id,
                  role.position,
                  member.user.id,
                  guildActivity.activityName,
                  highestBotRole
                )
              ]
            });
          }
        }
      }
    }
  }
}

export async function checkAllRoles(guild: Discord.Guild) {
  msg.log.activity();
  await checkGuild(guild);

  const guildActivityList = await GuildData.find({
    guildID: guild.id.toString()
  }).lean();
  const highestBotRole: number | undefined = guild?.me?.roles.highest.position;
  if (highestBotRole === undefined) return;

  guild.members.cache.forEach(async member => {
    user: {
      if (member.user.bot) break user;
      await checkUser(member.user);

      const doc = await UserConfig.findById(member.user.id.toString());
      if (!doc.autoRole) break user;

      const userActivityList = await UserData.find({
        userID: member.user.id.toString()
      }).lean();

      for (const x in guildActivityList) {
        this_role: {
          const userHasRole: boolean = member.roles.cache.has(guildActivityList[x].roleID);
          let role: Discord.Role | undefined = member.guild.roles.cache.find(
            _role => _role.id === guildActivityList[x].roleID
          );
          if (role === undefined) {
            break this_role; //FIXME: What if role gets removed?
          } else {
            role = role as Discord.Role;
          }
          let userShouldHaveRole = false;
          userActivities: {
            if (!guildActivityList[x].exactActivityName) {
              for (const y in userActivityList) {
                if (userActivityList[y].activityName.includes(guildActivityList[x].activityName)) {
                  if (!userActivityList[y].ignored && userActivityList[y].autoRole) {
                    userShouldHaveRole = true;
                    break userActivities;
                  }
                }
              }
            } else {
              const userActivityListFiltered = userActivityList.filter(
                (elmt: { activityName: string }) =>
                  elmt.activityName === guildActivityList[x].activityName
              );
              for (const y in userActivityListFiltered) {
                if (userActivityListFiltered[y]) {
                  if (
                    !userActivityListFiltered[y].ignored &&
                    userActivityListFiltered[y].autoRole
                  ) {
                    userShouldHaveRole = true;
                    break userActivities;
                  }
                }
              }
            }
          }

          if (userShouldHaveRole && !userHasRole) {
            // add role to member
            if (role.position < highestBotRole) {
              member.roles.add(role);
              msg.log.addedRoleToMember(
                role.name,
                guildActivityList[x].roleID,
                member.user.username,
                member.user.id,
                member.guild.name,
                member.guild.id
              );
            } else if (
              'logChannelID' in (await GuildConfig.findById(member.guild.id.toString()).lean())
            ) {
              const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
              const channel = guild.channels.cache.find(
                _channel => _channel.id === _guildConfig.logChannelID && _channel.isText()
              ) as Discord.TextChannel;
              if (channel) {
                msg.log.errorCantAssignRole(
                  role.name,
                  role.id,
                  role.position,
                  member.user.username,
                  member.user.id,
                  guildActivityList[x].activityName,
                  highestBotRole
                );
                channel.send({
                  embeds: [
                    msg.errorCantAssignRole(
                      role.id,
                      role.position,
                      member.user.id,
                      guildActivityList[x].activityName,
                      highestBotRole
                    )
                  ]
                });
              }
            }
          } else if (!userShouldHaveRole && userHasRole) {
            // remove role from member
            if (role.position < highestBotRole) {
              member.roles.remove(role);
              msg.log.removedRoleFromMember(
                role.name,
                guildActivityList[x].roleID,
                member.user.username,
                member.user.id,
                member.guild.name,
                member.guild.id
              );
            } else if (
              'logChannelID' in (await GuildConfig.findById(member.guild.id.toString()).lean())
            ) {
              const _guildConfig = await GuildConfig.findById(member.guild.id.toString()).lean();
              const channel = guild.channels.cache.find(
                _channel => _channel.id === _guildConfig.logChannelID && _channel.isText()
              ) as Discord.TextChannel;
              if (channel) {
                msg.log.errorCantRemoveRole(
                  role.name,
                  role.id,
                  role.position,
                  member.user.username,
                  member.user.id,
                  guildActivityList[x].activityName,
                  highestBotRole
                );
                channel.send({
                  embeds: [
                    msg.errorCantRemoveRole(
                      role.id,
                      role.position,
                      member.user.id,
                      guildActivityList[x].activityName,
                      highestBotRole
                    )
                  ]
                });
              }
            }
          }
        }
      }
    }
  });
}
