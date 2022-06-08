import Discord from 'discord.js';
import mongoose from 'mongoose';

import msg from './messages';
import config from '../../config';

import { UserConfig, UserConfigType } from './models/userConfig';
import { GuildConfig, GuildConfigType } from './models/guildConfig';
import { UserData, UserDataType } from './models/userData';
import { GuildData, GuildDataType } from './models/guildData';

export { UserConfig, UserConfigType } from './models/userConfig';
export { GuildConfig, GuildConfigType } from './models/guildConfig';
export { UserData, UserDataType } from './models/userData';
export { GuildData, GuildDataType } from './models/guildData';

/**
 * Connect to the MongoDB database.
 * @param {string} uri - the URI of the database to connect to.
 * @returns None
 */
export async function connect(uri: string) {
  await mongoose.connect(uri);
  msg.log.mongodbConnect();
}

/**
 * Checks if the guild is in the database.
 * @param {Discord.Guild} guild - The guild to check.
 * @returns None
 */
export async function checkGuild(guild: Discord.Guild): Promise<void> {
  msg.log.activity();
  if (await GuildConfig.findById(guild.id)) return;
  if (!guild.me?.permissions.has('MANAGE_CHANNELS')) return;
  const channel = await guild.channels.create('activity-roles', {
    type: 'GUILD_TEXT',
    topic: 'This channel is used by Activity Roles'
  });
  channel.send({ embeds: [msg.newLogChannel()] });
  new GuildConfig({
    _id: guild.id,
    logChannelID: channel.id
  }).save();
  msg.log.addGuild(guild.name, guild.id);
}

/**
 * Checks if the user is in the database.
 * @param {Discord.User} user - the user to check for a UserConfig object
 * @returns {Promise<boolean>} - whether or not the user has a UserConfig object in the database.
 */
export async function checkUser(user: Discord.User): Promise<boolean> {
  msg.log.activity();
  if (!(await UserConfig.findById(user.id).exec())) {
    await new UserConfig({
      _id: user.id,
      autoRole: true
    }).save();
    msg.log.addUser(user.username, user.id);
    return false;
  }
  return true;
}

function userHasActivity(
  userActivityList: UserDataType[],
  activity: string,
  exact: boolean
): boolean {
  let filter;
  if (exact) filter = (elmt: UserDataType) => elmt.activityName === activity;
  else
    filter = (elmt: UserDataType) =>
      elmt.activityName.toLowerCase().includes(activity.toLowerCase());
  const userActivityListFiltered = userActivityList.filter(filter);
  if (userActivityListFiltered.length > 1) msg.log.duplicateActivity(userActivityListFiltered);
  if (userActivityListFiltered.length > 0 && userActivityListFiltered[0].autoRole) return true;
  return false;
}

function userHasLiveActivity(
  member: Discord.GuildMember,
  activity: string,
  exact: boolean
): boolean {
  if (!member.presence) return false;
  let filter;
  if (exact) filter = (elmt: Discord.Activity) => elmt.name === activity;
  else
    filter = (elmt: Discord.Activity) => elmt.name.toLowerCase().includes(activity.toLowerCase());
  const userActivityListFiltered = member.presence.activities.filter(filter);
  if (userActivityListFiltered.length > 0) return true;
  return false;
}

async function manageUserRole(
  addRole: boolean,
  role: Discord.Role,
  highestBotRole: Discord.Role,
  member: Discord.GuildMember,
  guildActivityRole: GuildDataType,
  guildConfig: GuildConfigType,
  live: boolean
) {
  if (
    highestBotRole.comparePositionTo(role) > 0 &&
    member.guild.me?.permissions.has('MANAGE_ROLES')
  ) {
    if (addRole) member.roles.add(role);
    else member.roles.remove(role);
    msg.log.addedRemovedRoleToFromMember(
      addRole,
      role.name,
      guildActivityRole.roleID,
      member.user.username,
      member.user.id,
      member.guild.name,
      member.guild.id,
      live
    );
    return;
  }
  msg.log.errorCantAssignRemoveRole(
    addRole,
    role.name,
    role.id,
    role.position,
    member.user.username,
    member.user.id,
    guildActivityRole.activityName,
    highestBotRole.position
  );
  const logChannel = member.guild.channels.cache.find(
    channel => channel.id === guildConfig.logChannelID
  );
  if (!logChannel?.isText()) return;
  if (!logChannel.guild.me?.permissionsIn(logChannel).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return;
  logChannel.send({
    embeds: [
      msg.errorCantAssignRemoveRole(
        addRole,
        role.id,
        role.position,
        member.user.id,
        guildActivityRole.activityName,
        highestBotRole.position
      )
    ]
  });
}

async function checkMemberRoles(
  member: Discord.GuildMember,
  guildConfig: GuildConfigType,
  guildActivityRoles: GuildDataType[],
  onlyLive: boolean
) {
  if (member.user.bot) return;
  await checkUser(member.user);
  const userConfig: UserConfigType | null = await UserConfig.findById(member.user.id);
  if (!userConfig?.autoRole) return;

  let userActivityList: UserDataType[] | null = null;
  if (!onlyLive) {
    userActivityList = await UserData.find({ userID: member.user.id }).lean();
  }
  const highestBotRole = member?.guild?.me?.roles.highest;
  if (!highestBotRole) return;

  for (const guildActivityRole of guildActivityRoles) {
    await member.fetch();
    const userHasRole = member.roles.cache.has(guildActivityRole.roleID);
    const role = member.guild.roles.cache.find(role => role.id === guildActivityRole.roleID);
    if (role === undefined) break; //FIXME: What if role gets removed? -> add log message role not found

    let userShouldHaveRole;
    if (guildActivityRole.live) {
      userShouldHaveRole = userHasLiveActivity(
        member,
        guildActivityRole.activityName,
        guildActivityRole.exactActivityName
      );
    } else {
      userShouldHaveRole = userHasActivity(
        userActivityList!, // won't be called if onlyLive is true
        guildActivityRole.activityName,
        guildActivityRole.exactActivityName
      );
    }

    if (userShouldHaveRole && !userHasRole) {
      manageUserRole(
        true,
        role,
        highestBotRole,
        member,
        guildActivityRole,
        guildConfig,
        guildActivityRole.live
      );
      return;
    } else if (!userShouldHaveRole && userHasRole) {
      manageUserRole(
        false,
        role,
        highestBotRole,
        member,
        guildActivityRole,
        guildConfig,
        guildActivityRole.live
      );
      return;
    }
  }
}

/**
 * Checks the user's roles and automatically assigns them to the appropriate role.
 * @param {Discord.GuildMember} member - The member to check.
 * @returns None
 */
export async function checkRoles(member: Discord.GuildMember) {
  msg.log.activity();
  await checkGuild(member.guild);
  const guildConfig: GuildConfigType | null = await GuildConfig.findById(member.guild.id);
  if (!guildConfig) return;
  const guildActivityRoles: GuildDataType[] = await GuildData.find({
    guildID: member.guild.id
  }).lean();
  if (guildActivityRoles.length === 0) return;
  const onlyLive = guildActivityRoles.filter(elmt => !elmt.live).length === 0;
  checkMemberRoles(member, guildConfig, guildActivityRoles, onlyLive);
}

/**
 * Checks all roles in the guild and their roles accordingly.
 * @param {Discord.Guild} guild - The guild to check.
 * @returns None
 */
export async function checkAllRoles(guild: Discord.Guild) {
  msg.log.activity();

  await checkGuild(guild);
  const guildConfig: GuildConfigType | null = await GuildConfig.findById(guild.id);
  if (!guildConfig) return;
  const guildActivityRoles: GuildDataType[] = await GuildData.find({
    guildID: guild.id
  }).lean();
  if (guildActivityRoles.length === 0) return;
  const onlyLive = guildActivityRoles.filter(elmt => !elmt.live).length === 0;

  for (const member of guild.members.cache.values()) {
    checkMemberRoles(member, guildConfig, guildActivityRoles, onlyLive);
  }
}
export async function setGuildCheckInterval(client: Discord.Client) {
  if (!config.guildCheckInterval.enabled) return;
  let guilds: GuildDataType[];
  if (config.guildCheckInterval.onlyWithLiveRole) {
    guilds = await GuildData.find({ live: true }).lean();
  } else {
    guilds = await GuildData.find().lean();
  }
  const guildIDs = [...new Set(guilds.map(elmt => elmt.guildID))];
  client.guilds.cache
    .filter(guild => guildIDs.includes(guild.id))
    .forEach(guild => {
      setInterval(() => checkAllRoles(guild), config.guildCheckInterval.interval);
    });
  msg.log.checkGuildIntervalEnabled(guildIDs.length);
}
