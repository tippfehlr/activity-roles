// SPDX-License-Identifier: AGPL-3.0-only

import { ActivityType, Events } from 'discord.js';

import { client } from './bot';
import CommandHandler from './commandHandler';
import config from './config';
import { configureInfluxDB } from './metrics';
import { getUserCount, getRolesCount, db } from './db';
import { i18n, log } from './messages';

import activityStats from './commands/activityStats';
import addActivityRole from './commands/addActivityRole';
import checkRoles, { checkRolesStandalone } from './commands/checkRoles';
import deleteActivityRole from './commands/deleteActivityRole';
import deleteStatusRole from './commands/deleteStatusRole';
import _export from './commands/export';
import help from './commands/help';
import listRoles from './commands/listRoles';
import requireRole from './commands/requireRole';
import reset from './commands/reset';
import setStatusRole from './commands/setStatusRole';
import stats from './commands/stats';
import toggleAutoRole from './commands/toggleAutoRole';

export let commandHandler: CommandHandler;

export function initClientReady() {
  client.on(Events.ClientReady, async () => {
    configureInfluxDB();
    commandHandler = new CommandHandler(client)
      .addCommand(activityStats)
      .addCommand(addActivityRole)
      .addCommand(checkRoles)
      .addCommand(deleteActivityRole)
      .addCommand(deleteStatusRole)
      .addCommand(_export)
      .addCommand(help)
      .addCommand(listRoles)
      .addCommand(requireRole)
      .addCommand(reset)
      .addCommand(setStatusRole)
      .addCommand(stats)
      .addCommand(toggleAutoRole);
    if (!config.SKIP_COMMAND_UPLOAD) await commandHandler.uploadCommands();

    const setActivityGuilds = () => {
      client.user?.setPresence({
        status: 'online',
        afk: false,
        activities: [
          {
            name: i18n.__n({
              singular: '%s guild',
              plural: '%s guilds',
              locale: 'en-US',
              count: client.guilds.cache.size,
            }),
            type: ActivityType.Watching,
          },
        ],
      });
      setTimeout(setActivityUsers, 10 * 1000);
    };
    const setActivityUsers = async () => {
      client.user?.setPresence({
        activities: [
          {
            name: i18n.__n({
              singular: '%s user',
              plural: '%s users',
              locale: 'en-US',
              count: await getUserCount(),
            }),
            type: ActivityType.Watching,
          },
        ],
      });
      setTimeout(setActivityActivityRoles, 10 * 1000);
    };
    const setActivityActivityRoles = async () => {
      client.user?.setPresence({
        activities: [
          {
            name: i18n.__n({
              singular: '%s role',
              plural: '%s roles',
              locale: 'en-US',
              count: await getRolesCount(),
            }),
            type: ActivityType.Watching,
          },
        ],
      });
      setTimeout(setActivityGuilds, 10 * 1000);
    };
    setActivityGuilds();

    log.info(
      `Logged in as ${client.user?.username}#${client.user?.discriminator} (${client.user?.id})`,
    );
    log.info(
      `The bot is currently in ${client.guilds.cache.size} guilds with ${await getUserCount()} users and manages ${await getRolesCount()} roles`,
    );

    // checkroles:
    // execute every 30 minutes
    // check if the last check was more than 20 hours ago
    checkGuilds();
    setInterval(checkGuilds, 30 * 60 * 1000);

    // membercount:
    // execute every 24 hours
    // check if the last update was more than 7 days ago
    updateMemberCount();
    setInterval(updateMemberCount, 24 * 60 * 60 * 1000);

    // scheduled role actions:
    // execute every 6 hours
    // check for roles to add or remove in scheduledRoleActions
    executeScheduledRoleActions();
    setInterval(executeScheduledRoleActions, 6 * 60 * 60 * 1000);
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function checkGuilds() {
  const guildsToCheck = await db
    .selectFrom('guilds')
    .select('guildID')
    .where('lastCheckRoles', '<', new Date(Date.now() - 20 * 60 * 60 * 1000))
    .orderBy('lastCheckRoles asc')
    .execute();
  await client.guilds.fetch();
  for (const { guildID } of guildsToCheck) {
    await delay(30 * 1000);
    const guild = client.guilds.cache.get(guildID);
    if (guild) await checkRolesStandalone({ guild });
  }
}

async function updateMemberCount() {
  const guildsToUpdate = await db
    .selectFrom('guilds')
    .select(['guildID'])
    .where(eb =>
      eb.or([
        eb('approxMemberCountLastUpdate', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        eb('approxMemberCountLastUpdate', 'is', null),
        eb('approxMemberCount', 'is', null),
      ]),
    )
    .execute();
  await client.guilds.fetch();
  for (const dbGuild of guildsToUpdate) {
    const guild = client.guilds.cache.get(dbGuild.guildID);
    if (!guild) continue;
    await guild.members.fetch();
    await db
      .updateTable('guilds')
      .set({
        approxMemberCount: guild.memberCount,
        approxMemberCountLastUpdate: new Date(),
      })
      .where('guildID', '=', dbGuild.guildID)
      .execute();
  }
}

async function executeScheduledRoleActions() {
  // ensure that only executed schedules get deleted.
  // otherwise, this could start at 23:59 and end after midnight,
  // deleting the schedules for the new day accidently.
  const date = new Date();
  const actionsDue = await db
    .deleteFrom('scheduledRoleActions')
    .where('scheduledDate', '<=', date)
    .returning(['action', 'roleID', 'guildID', 'userID'])
    .execute();
  let stats = { added: 0, removed: 0 };

  for (const action of actionsDue) {
    if (action.action === 'add') {
      const guild = await client.guilds.fetch(action.guildID);
      if (!guild) continue;
      const user = await guild.members.fetch(action.userID);
      if (!user) continue;

      try {
        user.roles.add(action.roleID);
        stats.added += 1;
      } catch (error) {
        log.error(
          `scheduledRoleActions: should assign role ${action.roleID} to user ` +
            `${user.nickname} (${user.id}) on guild ${guild.name} (${guild.id}) ` +
            'but it (probably) doesn’t exist.',
          error,
        );
      }
    } else if (action.action === 'remove') {
      const guild = await client.guilds.fetch(action.guildID);
      if (1 || 2) {
      }
      if (!guild) continue;
      const user = await guild.members.fetch(action.userID);
      if (!user) continue;

      try {
        user.roles.remove(action.roleID);
        stats.removed += 1;
      } catch (error) {
        log.error(
          `scheduledRoleActions: should remove role ${action.roleID} to user ` +
            `${user.nickname} (${user.id}) on guild ${guild.name} (${guild.id}) ` +
            'but it (probably) doesn’t exist.',
          error,
        );
      }
    }
  }
  log.info(`scheduledRoleActions: added ${stats.added} and removed ${stats.removed} roles.`);
}
