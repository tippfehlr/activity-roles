import fs from 'fs';
import sqlite3 from 'better-sqlite3';
import { createHash } from 'crypto';
import { ActivityType, CommandInteraction, Locale, StringSelectMenuInteraction } from 'discord.js';
import { log } from './messages';

export interface DBUser {
  userIDHash: string;
  autoRole: 1 | 0;
  language: Locale | 'none';
}

export interface DBGuild {
  guildID: string;
  language: Locale;
  requiredRoleID: string | null;
}

export interface DBActivityRole {
  guildID: string;
  activityName: string;
  roleID: string;
  exactActivityName: 1 | 0;
  live: 1 | 0;
}

export interface DBStatusRole {
  guildID: string;
  type: ActivityType;
  roleID: string;
}

export interface DBCurrentlyActiveActivity {
  userIDHash: string;
  guildID: string;
  activityName: string;
}

/// @deprecated use DBActivityStatus instead
export interface DBActiveTemporaryRoles {
  userIDHash: string;
  guildId: string;
  roleID: string;
}

export interface DBActivityStats {
  guildID: string;
  activityName: string;
  count: number;
}

export interface DBVersion {
  version: number;
  enforcer: 0;
}

export let db: sqlite3.Database;

export function prepareDB() {
  if (!fs.existsSync('db')) fs.mkdirSync('db');
  db = new sqlite3('db/activity-roles.db');

  // live -> permanent: the database was not updated on purpose.
  // enforcer: see https://stackoverflow.com/a/3010975/16292720 (comment 4)
  db.prepare(
    'CREATE TABLE IF NOT EXISTS dbversion (version INT NOT NULL, enforcer INT DEFAULT 0 NOT NULL CHECK(enforcer == 0), UNIQUE (enforcer))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS users (userIDHash TEXT PRIMARY KEY, autoRole INTEGER, language TEXT)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS guilds (guildID TEXT PRIMARY KEY, language TEXT, requiredRoleID TEXT)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS activityRoles (guildID TEXT, activityName TEXT, roleID TEXT, exactActivityName INTEGER, live INTEGER, PRIMARY KEY (guildID, activityName, roleID))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS statusRoles (guildID TEXT, type INTEGER, roleID TEXT, PRIMARY KEY (guildID, type, roleID))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS currentlyActiveActivities (userIDHash TEXT, guildID TEXT, activityName TEXT, PRIMARY KEY (userIDHash, guildID, activityName))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS activeTemporaryRoles (userIDHash, guildID TEXT, roleID TEXT, PRIMARY KEY (userIDHash, guildID, roleID))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS activityStats (guildID TEXT, activityName TEXT, count INTEGER, PRIMARY KEY (guildID, activityName))'
  ).run();

  if (!db.prepare('SELECT * FROM dbversion').get()) {
    db.prepare('INSERT INTO dbversion (version) VALUES (1)').run();
  }

  const latestDBVersion = 3;
  let dbVersion = (db.prepare('SELECT * FROM dbversion').get() as DBVersion).version;

  if (dbVersion === 1) {
    // add status roles
    // add activeTemporaryRoles
    // fade out currentlyActiveActivites
    db.prepare('UPDATE dbversion SET version = 2').run();
    dbVersion = 2;
  }
  if (dbVersion === 2) {
    db.prepare("DELETE FROM activityStats WHERE activityName = 'Custom Status'").run();
    db.prepare('UPDATE dbversion SET version = 3').run();
    dbVersion = 3;
  }

  //TODO: add bot version?
  if (dbVersion > latestDBVersion) {
    log.warn(
      `Database version: ${dbVersion}. The latest known database version is ${latestDBVersion}! Are you opening a database created with a newer version?`
    );
  } else {
    log.info(`Database version: ${dbVersion}`);
  }
}

export function getUserConfig(userID: string): DBUser {
  const userIDHash = createHash('sha256').update(userID).digest('base64');
  const user = db.prepare('SELECT * FROM users WHERE userIDHash = ?').get(userIDHash) as DBUser;
  if (user) return user;
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(userIDHash, 1, 'none');
  return { userIDHash: userIDHash, autoRole: 1, language: 'none' };
}

export function getGuildConfig(guildID: string): DBGuild {
  const guild = db.prepare('SELECT * FROM guilds WHERE guildID = ?').get(guildID) as DBGuild;
  if (guild) return guild;
  db.prepare('INSERT INTO guilds VALUES (?, ?, NULL)').run(guildID, 'en-US');
  return { guildID: guildID, language: 'en-US' as Locale, requiredRoleID: null };
}

export function getActivityRoles(guildID: string): DBActivityRole[] {
  return db
    .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
    .all(guildID) as DBActivityRole[];
}

export function getStatusRoles(guildID: string): DBStatusRole[] {
  return db.prepare('SELECT * FROM statusRoles WHERE guildID = ?').all(guildID) as DBStatusRole[];
}

export function getLang(interaction: CommandInteraction | StringSelectMenuInteraction): Locale {
  const userLang = getUserConfig(interaction.user.id).language;
  if (userLang !== 'none') return userLang;

  if (!interaction.guild) return 'en-US' as Locale;

  return getGuildConfig(interaction.guild.id).language;
}

export async function addActivity(guildID: string, activityName: string) {
  db.prepare(
    'INSERT INTO activityStats VALUES (?, ?, ?) ON CONFLICT(guildID, activityName) DO UPDATE SET count = count + 1'
  ).run(guildID, activityName, 1);
}
