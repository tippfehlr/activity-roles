import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('guilds')
    .addColumn('approxMemberCount', 'integer')
    .addColumn('approxMemberCountLastUpdate', 'timestamp')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('guilds')
    .dropColumn('approxMemberCount')
    .dropColumn('approxMemberCountLastUpdate')
    .execute();
}
