// SPDX-License-Identifier: AGPL-3.0-only

import Discord, { Events, GatewayIntentBits, Options } from 'discord.js';

import { getGuildConfig, roleRemoved } from './db';
import config from './config';
import { log } from './messages';
import { clientReady } from './bot.ready';
import { presenceUpdate } from './bot.presenceUpdate';

export const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 0,
    // UserManager: {
    //   maxSize: 25000,
    //   keepOverLimit: user => user.id === user.client.user.id,
    // },
    // GuildMemberManager: {
    //   maxSize: 5000,
    //   keepOverLimit: member => member.id === member.client.user.id,
    // },
    // PresenceManager: 50000,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    // users: {
    //   interval: 60 * 60, // in seconds, 1 hour
    //   filter: () => user => user.id !== user.client.user.id, // don’t remove the client’s user
    // },
    // guildMembers: {
    //   interval: 60 * 60,
    //   filter: () => member => member.id !== member.client.user.id,
    // },
    // presences: {
    //   interval: 60 * 60,
    //   filter: () => () => true, // remove all presences
    // },
  },
});

export const stats = {
  presenceUpdates: 0,
  rolesAdded: 0,
  rolesRemoved: 0,
  webSocketErrors: 0,
};
export function resetStats() {
  stats.presenceUpdates = 0;
  stats.rolesAdded = 0;
  stats.rolesRemoved = 0;
  stats.webSocketErrors = 0;
}

export function initBot() {
  client.on(Events.GuildCreate, guild => {
    log.info(`Joined guild ${guild.name}(${guild.id})`);
    getGuildConfig(guild.id);
  });

  client.on(Events.GuildDelete, guild => log.info(`Left guild ${guild.name}(${guild.id})`));

  client.on(Events.Error, error => {
    log.error(error, 'The Discord WebSocket has encountered an error');
    stats.webSocketErrors++;
    if (error.message === 'driver has already been destroyed') {
      process.exit();
    }
  });

  client.on(Events.GuildRoleDelete, role => {
    roleRemoved(role.id, role.guild.id);
  });

  client.on(Events.ClientReady, clientReady);
  client.on(Events.PresenceUpdate, presenceUpdate);

  client.login(config.TOKEN);
}
