import { ActivityType, Events } from 'discord.js';
import { getUserCount, getRolesCount } from './db';
import { i18n, log } from './messages';
import CommandHandler from './commandHandler';
import { configureInfluxDB } from './metrics';
import { client } from './bot';

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
  });
}
