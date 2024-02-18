import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'
export { Point } from '@influxdata/influxdb-client'

import { client as discordClient } from './bot';
import config from './config';
import { log } from './messages';

import { stats as botStats, resetStats as resetBotStats } from './bot';
import { getDBUserCount, getRolesCount, stats as dbStats, resetStats as resetDBStats } from './db';

export let client: InfluxDB;
export let writeApi: WriteApi;

export async function configureInfluxDB() {
  if (config.INFLUX_URL && config.INFLUX_TOKEN) {
    client = new InfluxDB({ url: config.INFLUX_URL, token: config.INFLUX_TOKEN });
    writeApi = client.getWriteApi('activity-roles', 'activity-roles');

    const writeIntPoint = (name: string, fieldName: string, value: number) => {
      writeApi.writePoint(new Point(name).intField(fieldName, value));
    }

    writeIntPoint('process', 'started', 1);
    setInterval(() => {
      writeIntPoint('presence_updates', 'presence_updates', botStats.presenceUpdates);
      writeIntPoint('missing_access', 'missing_access', botStats.missingAccess);
      writeIntPoint('roles_added', 'roles_added', botStats.rolesAdded);
      writeIntPoint('roles_removed', 'roles_removed', botStats.rolesRemoved);
      writeIntPoint('web_socket_errors', 'web_socket_errors', botStats.webSocketErrors);
      writeIntPoint('guilds', 'guilds_total', discordClient.guilds.cache.size);
      writeIntPoint('roles', 'roles_count', getRolesCount());
      writeApi.writePoint(
        new Point('users')
          .intField('users_cache_total', discordClient.users.cache.size)
          .intField('users_db_total', getDBUserCount())
      );
      writeIntPoint('db', 'calls', dbStats.dbCalls);

      resetBotStats();
      resetDBStats();
    }, 1000);

    process.on('exit', () => {
      writeIntPoint('process', 'exited', 1);
      writeApi.close();
    });
  } else {
    log.info('InfluxDB not configured');
  }
}

