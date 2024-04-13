import fs from 'fs';
import { createHash } from 'crypto';
import { CommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { Pool } from 'pg';
import { FileMigrationProvider, Kysely, Migrator, PostgresDialect, Selectable } from 'kysely';
import path from 'path';

import { locales, log } from './messages';
import { DB, ActivityRoles, Guilds, StatusRoles, Users } from './db.types';
import config from './config';
import { writeIntPoint } from './metrics';

const pool = new Pool({ connectionString: config.DATABASE_URL, max: 10 });
const dialect = new PostgresDialect({ pool });
export const db = new Kysely<DB>({ dialect });
const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs: fs.promises,
    path,
    migrationFolder: path.join(__dirname, 'migrations'),
  }),
});

export async function initDB() {
  await pool.connect().catch(err => {
    log.error('Couldn’t connect to the database: ' + err.code);
    process.exit(1);
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach(it => {
    if (it.status === 'Success') {
      log.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      log.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error('failed to migrate', error);
    process.exit(1);
  }
}

export const checkrolesCurrentGuilds: Set<string> = new Set();

export function hashUserID(userID: string): string {
  return createHash('sha256').update(userID).digest('base64');
}

export async function getUserConfig(userID: string): Promise<Selectable<Users>> {
  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('userID', '=', userID)
    .executeTakeFirst();
  if (user) return user;

  const userIDHash = hashUserID(userID);
  const userHashed = await db
    .selectFrom('usersHashed')
    .selectAll()
    .where('userIDHash', '=', userIDHash)
    .executeTakeFirst();
  if (userHashed) {
    db.insertInto('users')
      .values({ userID, autorole: userHashed.autorole })
      .onConflict(oc => oc.column('userID').doNothing())
      .execute()
      .then(() => {
        db.deleteFrom('usersHashed').where('userIDHash', '=', userIDHash).execute();
      });
    return { userID, autorole: userHashed.autorole };
  }

  db.insertInto('users')
    .values({ userID })
    .onConflict(oc => oc.column('userID').doNothing())
    .execute();
  return { userID, autorole: true };
}

export async function getGuildConfig(guildID: string): Promise<Selectable<Guilds>> {
  const guild = await db
    .selectFrom('guilds')
    .selectAll()
    .where('guildID', '=', guildID)
    .executeTakeFirst();
  if (guild) return guild;
  db.insertInto('guilds')
    .values({ guildID })
    .onConflict(oc => oc.column('guildID').doNothing())
    .execute();
  return { guildID: guildID, requiredRoleID: null };
}

export async function getActivityRoles(guildID: string): Promise<Selectable<ActivityRoles>[]> {
  return await db.selectFrom('activityRoles').selectAll().where('guildID', '=', guildID).execute();
}

export async function getStatusRoles(guildID: string): Promise<Selectable<StatusRoles>[]> {
  return await db.selectFrom('statusRoles').selectAll().where('guildID', '=', guildID).execute();
}

export function getLang(interaction: CommandInteraction | StringSelectMenuInteraction): string {
  writeIntPoint('locale', interaction.locale, 1);
  if (locales.includes(interaction.locale)) return interaction.locale;
  else return 'en-US';
}

export async function addActivity(guildID: string, activityName: string) {
  db.insertInto('activityStats')
    .values({ guildID, activityName, count: 1 })
    .onConflict(oc =>
      oc
        .columns(['guildID', 'activityName'])
        .doUpdateSet(eb => ({ count: eb('activityStats.count', '+', 1) })),
    )
    .execute();
}

export async function getOldUserCount(): Promise<number> {
  return (
    await db
      .selectFrom('usersHashed')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getNewUserCount(): Promise<number> {
  return (
    await db
      .selectFrom('users')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getUserCount(): Promise<number> {
  return (await getOldUserCount()) + (await getNewUserCount());
}

export async function getActivityRoleCount(): Promise<number> {
  return (
    await db
      .selectFrom('activityRoles')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getStatusRoleCount(): Promise<number> {
  return (
    await db
      .selectFrom('statusRoles')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getTempRoleCount(): Promise<number> {
  return (
    await db
      .selectFrom('activityRoles')
      .select(eb => eb.fn.countAll().as('count'))
      .where('permanent', '=', false)
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getPermRoleCount(): Promise<number> {
  return (
    await db
      .selectFrom('activityRoles')
      .select(eb => eb.fn.countAll().as('count'))
      .where('permanent', '=', true)
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getRolesCount(): Promise<number> {
  return (await getActivityRoleCount()) + (await getStatusRoleCount());
}

export async function getOldActiveTemporaryRolesCount(): Promise<number> {
  return (
    await db
      .selectFrom('activeTemporaryRolesHashed')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getNewActiveTemporaryRolesCount(): Promise<number> {
  return (
    await db
      .selectFrom('activeTemporaryRoles')
      .select(eb => eb.fn.countAll().as('count'))
      .executeTakeFirstOrThrow()
  ).count as number;
}

export async function getActiveTemporaryRolesCount(): Promise<number> {
  return (await getOldActiveTemporaryRolesCount()) + (await getNewActiveTemporaryRolesCount());
}
