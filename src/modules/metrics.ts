import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client'
export { Point } from '@influxdata/influxdb-client'

import { client as discordClient } from './bot';
import config from './config';
import { log } from './messages';

import { stats as botStats, resetStats as resetBotStats } from './bot';
import { getUserCount, getRolesCount, stats as dbStats, resetStats as resetDBStats, getTempRoleCount, getPermRoleCount, getStatusRoleCount } from './db';

export let client: InfluxDB;
export let writeApi: WriteApi;

export function writeIntPoint(name: string, fieldName: string, value: number) {
  if (writeApi) writeApi.writePoint(new Point(name).intField(fieldName, value));
}


export async function configureInfluxDB() {
  if (config.INFLUX_URL && config.INFLUX_TOKEN && config.INFLUX_ORG && config.INFLUX_BUCKET) {
    client = new InfluxDB({ url: config.INFLUX_URL, token: config.INFLUX_TOKEN });
    writeApi = client.getWriteApi(config.INFLUX_ORG, config.INFLUX_BUCKET);

    writeIntPoint('process', 'started', 1);
    setInterval(() => {
      const startTime = performance.now();

      writeIntPoint('presence_updates', 'presence_updates', botStats.presenceUpdates);
      writeIntPoint('roles_added', 'roles_added', botStats.rolesAdded);
      writeIntPoint('roles_removed', 'roles_removed', botStats.rolesRemoved);
      writeIntPoint('web_socket_errors', 'web_socket_errors', botStats.webSocketErrors);
      writeIntPoint('guilds', 'guilds_total', discordClient.guilds.cache.size);
      writeIntPoint('roles', 'roles_count', getRolesCount());
      writeIntPoint('roles', 'temporary_roles_count', getTempRoleCount());
      writeIntPoint('roles', 'permanent_roles_count', getPermRoleCount());
      writeIntPoint('roles', 'status_roles_count', getStatusRoleCount());
      writeApi.writePoint(
        new Point('users')
          .intField('users_cache_total', discordClient.users.cache.size)
          .intField('users_db_total', getUserCount())
      );
      writeIntPoint('db', 'calls', dbStats.dbCalls);
      const ram = process.memoryUsage();
      writeApi.writePoint(
        new Point('memory')
          .intField('rss', ram.rss)
          .intField('heap_total', ram.heapTotal)
          .intField('heap_used', ram.heapUsed)
          .intField('external', ram.external)
          .intField('array_buffers', ram.arrayBuffers)
      );

      resetBotStats();
      resetDBStats();

      writeIntPoint('metrics', 'time_ms', performance.now() - startTime);
    }, 1000);

    process.on('exit', () => {
      writeApi.close();
    });
  } else {
    log.info('InfluxDB not configured');
  }
}

