// SPDX-License-Identifier: AGPL-3.0-only

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('userID', 'text', col => col.primaryKey())
    .addColumn('autorole', 'boolean', col => col.notNull().defaultTo(true))
    .execute();

  await db.schema
    .createTable('usersHashed')
    .addColumn('userIDHash', 'text', col => col.primaryKey())
    .addColumn('autorole', 'boolean', col => col.notNull().defaultTo(true))
    .execute();

  await db.schema
    .createTable('guilds')
    .addColumn('guildID', 'text', col => col.primaryKey())
    .addColumn('requiredRoleID', 'text')
    .execute();

  await db.schema
    .createTable('activityRoles')
    .addColumn('guildID', 'text')
    .addColumn('activityName', 'text')
    .addColumn('roleID', 'text')
    .addColumn('exactActivityName', 'boolean', col => col.defaultTo(false).notNull())
    .addColumn('permanent', 'boolean', col => col.defaultTo(false).notNull())
    .addPrimaryKeyConstraint('activityRoles_0', ['guildID', 'roleID', 'activityName'])
    .execute();

  await db.schema
    .createTable('statusRoles')
    .addColumn('guildID', 'text')
    .addColumn('type', 'int2')
    .addColumn('roleID', 'text', col => col.notNull())
    .addPrimaryKeyConstraint('statusRoles_0', ['guildID', 'type'])
    .execute();

  await db.schema
    .createTable('activeTemporaryRolesHashed')
    .addColumn('userIDHash', 'text')
    .addColumn('guildID', 'text')
    .addColumn('roleID', 'text')
    .addPrimaryKeyConstraint('activeTemporaryRolesHashed_0', ['userIDHash', 'guildID', 'roleID'])
    .execute();

  await db.schema
    .createTable('activeTemporaryRoles')
    .addColumn('userID', 'text')
    .addColumn('guildID', 'text')
    .addColumn('roleID', 'text')
    .addPrimaryKeyConstraint('activeTemporaryRoles_0', ['userID', 'guildID', 'roleID'])
    .execute();

  await db.schema
    .createTable('activityStats')
    .addColumn('guildID', 'text')
    .addColumn('activityName', 'text')
    .addColumn('count', 'integer', col => col.defaultTo(0).notNull())
    .addPrimaryKeyConstraint('activityStats_0', ['guildID', 'activityName'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('usersNew').execute();
  await db.schema.dropTable('users').execute();
  await db.schema.dropTable('guilds').execute();
  await db.schema.dropTable('activityRoles').execute();
  await db.schema.dropTable('statusRoles').execute();
  await db.schema.dropTable('activeTemporaryRoles').execute();
  await db.schema.dropTable('activeTemporaryRolesNew').execute();
  await db.schema.dropTable('activityStats').execute();
}
