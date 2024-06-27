import { ActivityType, Events } from 'discord.js';
import { getUserCount, getRolesCount, db } from './db';
import { i18n, log } from './messages';
import CommandHandler from './commandHandler';
import { configureInfluxDB } from './metrics';
import { client } from './bot';
import { checkRoles } from './commands/checkRoles';

export let commandHandler: CommandHandler;

export function initClientReady() {
  client.on(Events.ClientReady, async () => {
    configureInfluxDB();
    commandHandler = new CommandHandler(client);
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
      `The bot is currently on ${client.guilds.cache.size} guilds with ${await getUserCount()} users and manages ${await getRolesCount()} roles`,
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
    if (guild) await checkRoles({ guild });
  }
}

async function updateMemberCount() {
  const guildsToUpdate = await db
    .selectFrom('guilds')
    .select(['guildID', 'approxMemberCount', 'approxMemberCountLastUpdate'])
    .where(eb =>
      eb.or([
        eb('approxMemberCountLastUpdate', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        eb('approxMemberCountLastUpdate', '=', null),
        eb('approxMemberCount', '=', null),
      ]),
    )
    .execute();

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
