// SPDX-License-Identifier: AGPL-3.0-only

import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('activityRoles')
    .addColumn('state', 'text')
    .addColumn('details', 'text')
    .execute();
  await db.schema.alterTable('activityRoles').renameColumn('exactActivityName', 'exact').execute();
  await db.schema.alterTable('activityRoles').dropConstraint('activityRoles_0').execute();
  await db.schema
    .alterTable('activityRoles')
    .addPrimaryKeyConstraint('activityRoles_0', [
      'guildID',
      'activityName',
      'roleID',
      'state',
      'details',
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('activityRoles').dropColumn('state').dropColumn('details').execute();
  await db.schema.alterTable('activityRoles').renameColumn('exact', 'exactActivityName').execute();
  await db.schema.alterTable('activityRoles').dropConstraint('activityRoles_0').execute();
  await db.schema
    .alterTable('activityRoles')
    .addPrimaryKeyConstraint('activityRoles_0', ['guildID', 'activityName', 'roleID'])
    .execute();
}
