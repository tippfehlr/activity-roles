import Discord, { ChannelType, PermissionsBitField } from 'discord.js';
import sqlite3 from 'better-sqlite3';

import msg from './messages';
import config from '../../config';

export interface UserData {
  userID: string;
  activityName: string;
  autoRole: 1 | 0;
  exactActivityName: 1 | 0;
}

export interface GuildData {
  guildID: string;
  activityName: string;
  roleID: string;
  exactActivityName: 1 | 0;
  live: 1 | 0;
}

export interface GuildConfig {
  guildID: string;
  logChannelID: string;
}

export interface UserConfig {
  userID: string;
  autoRole: 1 | 0;
}

export const db = sqlite3('activity-roles.db');

export function prepareDB() {
  db.prepare(
    'CREATE TABLE IF NOT EXISTS userConfig (userID TEXT PRIMARY KEY, autoRole INTEGER)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS guildConfig (guildID TEXT PRIMARY KEY, logChannelID TEXT)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS userData (userID TEXT, activityName TEXT, autoRole INTEGER, PRIMARY KEY (userID, activityName))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS guildData (guildID TEXT, activityName TEXT, roleID TEXT, exactActivityName INTEGER, live INTEGER, PRIMARY KEY (guildID, activityName, roleID))'
  ).run();
}

/**
 * Checks if the guild is in the database.
 * @param {Discord.Guild} guild - The guild to check.
 * @returns None
 */
export async function checkGuild(guild: Discord.Guild): Promise<void> {
  if (db.prepare('SELECT * FROM guildConfig WHERE guildID = ?').get(guild.id)) return;
  if (!guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) return;
  const channel = await guild.channels.create({
    name: 'activity-roles',
    type: ChannelType.GuildText,
    topic: 'This channel is used by Activity Roles'
  });
  channel.send({ embeds: [msg.newLogChannel()] });
  db.prepare('INSERT INTO guildConfig VALUES (?, ?)').run(guild.id, channel.id);
  msg.log.addGuild(guild.name, guild.id);
}

/**
 * Checks if the user is in the database.
 * @param {Discord.User} user - the user to check for a UserConfig object
 * @returns {Promise<boolean>} - whether or not the user has a UserConfig object in the database.
 */
export async function checkUser(user: Discord.User): Promise<void> {
  if (db.prepare('SELECT * FROM userConfig WHERE userID = ?').get(user.id)) return;
  db.prepare('INSERT INTO userConfig VALUES (?, ?)').run(user.id, 1);
  msg.log.addUser(user.username, user.id);
}

function userHasActivity(userActivityList: UserData[], activity: string, exact: boolean): boolean {
  let filter;
  if (exact) filter = (elmt: UserData) => elmt.activityName === activity;
  else
    filter = (elmt: UserData) => elmt.activityName.toLowerCase().includes(activity.toLowerCase());
  const userActivityListFiltered = userActivityList.filter(filter);
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
  guildActivityRole: GuildData,
  guildConfig: GuildConfig,
  live: boolean
) {
  if (
    highestBotRole.comparePositionTo(role) > 0 &&
    member.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)
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
  if (logChannel?.type !== ChannelType.GuildText) return;
  if (
    !logChannel.guild.members.me
      ?.permissionsIn(logChannel)
      .has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
  )
    return;
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
  guildConfig: GuildConfig,
  guildActivityRoles: GuildData[],
  onlyLive: boolean
) {
  if (member.user.bot) return;
  await checkUser(member.user);
  const userConfig: UserConfig | null = db
    .prepare('SELECT * FROM userConfig WHERE userID = ?')
    .get(member.user.id);
  if (!userConfig?.autoRole) return;

  let userActivityList: UserData[] | null = null;
  if (!onlyLive) {
    userActivityList = db.prepare('SELECT * FROM userData WHERE userID = ?').all(member.user.id);
  }
  const highestBotRole = member.guild.members.me?.roles.highest;
  if (!highestBotRole) return;

  for (const guildActivityRole of guildActivityRoles) {
    await member.fetch();
    const role = member.guild.roles.cache.find(role => role.id === guildActivityRole.roleID);
    const userHasRole = member.roles.cache.has(guildActivityRole.roleID);
    if (role === undefined) {
      db.prepare('DELETE FROM guildData WHERE roleID = ?').run(guildActivityRole.roleID);
      break;
    }

    let userShouldHaveRole;
    if (guildActivityRole.live) {
      userShouldHaveRole = userHasLiveActivity(
        member,
        guildActivityRole.activityName,
        Boolean(guildActivityRole.exactActivityName)
      );
    } else {
      userShouldHaveRole = userHasActivity(
        userActivityList!, // won't be called if onlyLive is true
        guildActivityRole.activityName,
        Boolean(guildActivityRole.exactActivityName)
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
        Boolean(guildActivityRole.live)
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
        Boolean(guildActivityRole.live)
      );
      return;
    }
  }
}

export async function checkMemberLiveRoles(
  member: Discord.GuildMember,
  activities: Discord.Activity[]
) {
  const guildConfig = db
    .prepare('SELECT * FROM guildConfig WHERE guildID = ?')
    .get(member.guild.id) as GuildConfig;

  const guildActivityLiveRoles = (
    db.prepare('SELECT * FROM guildData WHERE guildID = ?').all(member.guild.id) as GuildData[]
  ).filter(elmt => elmt.live);
  const userConfig = db.prepare('SELECT * FROM userConfig WHERE userID = ?').get(member.user.id) as
    | UserConfig
    | undefined;
  if (!userConfig?.autoRole) return;

  const highestBotRole = member.guild.members.me?.roles.highest;
  if (!highestBotRole) return;

  for (const guildActivityRole of guildActivityLiveRoles) {
    const role = member.guild.roles.cache.find(role => role.id === guildActivityRole.roleID);
    const userHasRole = member.roles.cache.has(guildActivityRole.roleID);
    if (role === undefined) break; //FIXME: What if role gets removed? -> add log message role not found

    const userShouldHaveRole =
      activities.filter(activity => {
        if (guildActivityRole.exactActivityName) {
          return guildActivityRole.activityName === activity.name;
        } else {
          return guildActivityRole.activityName.toLowerCase().includes(activity.name);
        }
      }).length !== 0;

    if (userShouldHaveRole && !userHasRole) {
      manageUserRole(
        true,
        role,
        highestBotRole,
        member,
        guildActivityRole,
        guildConfig,
        Boolean(guildActivityRole.live)
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
        Boolean(guildActivityRole.live)
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
  await checkGuild(member.guild);
  const guildConfig: GuildConfig | null = db
    .prepare('SELECT * FROM guildConfig WHERE guildID = ?')
    .get(member.guild.id);
  if (!guildConfig) return;
  const guildActivityRoles: GuildData[] = db
    .prepare('SELECT * FROM guildData WHERE guildID = ?')
    .all(member.guild.id);
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
  await checkGuild(guild);
  const guildConfig: GuildConfig | null = db
    .prepare('SELECT * FROM guildConfig WHERE guildID = ?')
    .get(guild.id);
  if (!guildConfig) return;
  const guildActivityRoles: GuildData[] = db
    .prepare('SELECT * FROM guildData WHERE guildID = ?')
    .all(guild.id);
  if (guildActivityRoles.length === 0) return;
  const onlyLive = guildActivityRoles.filter(elmt => !elmt.live).length === 0;

  for (const member of guild.members.cache.values()) {
    checkMemberRoles(member, guildConfig, guildActivityRoles, onlyLive);
  }
}
export async function setGuildCheckInterval(client: Discord.Client) {
  if (!config.guildCheckInterval.enabled) return;
  let guilds: GuildData[];
  if (config.guildCheckInterval.onlyWithLiveRole) {
    guilds = db.prepare('SELECT * FROM guildData WHERE live = 1').all();
  } else {
    guilds = db.prepare('SELECT * FROM guildData').all();
  }
  const guildIDs = [...new Set(guilds.map(elmt => elmt.guildID))];
  client.guilds.cache
    .filter(guild => guildIDs.includes(guild.id))
    .forEach(guild => {
      setInterval(() => checkAllRoles(guild), config.guildCheckInterval.interval);
    });
  msg.log.checkGuildIntervalEnabled(guildIDs.length);
}
