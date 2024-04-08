import fs from 'fs';
import sqlite from 'better-sqlite3';
import { createHash } from 'crypto';
import { ActivityType, CommandInteraction, StringSelectMenuInteraction } from 'discord.js';
import { log } from './messages';

export interface DBUser {
  userIDHash: string;
  autoRole: 1 | 0;
  language: string | 'none';
}

export interface DBGuild {
  guildID: string;
  language: string;
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

export let db: sqlite.Database;

export const checkrolesCurrentGuilds: Set<string> = new Set();

export const stats = {
  dbCalls: 0,
};

export function resetStats() {
  stats.dbCalls = 0;
}

export function prepare(query: string) {
  stats.dbCalls++;
  return db.prepare(query);
}

export function prepareDB() {
  if (!fs.existsSync('db')) fs.mkdirSync('db');
  db = new sqlite('db/activity-roles.db');

  // `v1.9.1` live -> permanent: the database was not updated on purpose.
  // enforcer: see https://stackoverflow.com/a/3010975/16292720 (comment 4)
  prepare(
    'CREATE TABLE IF NOT EXISTS dbversion (version INT NOT NULL, enforcer INT DEFAULT 0 NOT NULL CHECK(enforcer == 0), UNIQUE (enforcer))',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS users (userIDHash TEXT PRIMARY KEY, autoRole INTEGER, language TEXT)',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS guilds (guildID TEXT PRIMARY KEY, language TEXT, requiredRoleID TEXT)',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS activityRoles (guildID TEXT, activityName TEXT, roleID TEXT, exactActivityName INTEGER, live INTEGER, PRIMARY KEY (guildID, activityName, roleID))',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS statusRoles (guildID TEXT, type INTEGER, roleID TEXT, PRIMARY KEY (guildID, type, roleID))',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS currentlyActiveActivities (userIDHash TEXT, guildID TEXT, activityName TEXT, PRIMARY KEY (userIDHash, guildID, activityName))',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS activeTemporaryRoles (userIDHash, guildID TEXT, roleID TEXT, PRIMARY KEY (userIDHash, guildID, roleID))',
  ).run();
  prepare(
    'CREATE TABLE IF NOT EXISTS activityStats (guildID TEXT, activityName TEXT, count INTEGER, PRIMARY KEY (guildID, activityName))',
  ).run();

  const latestDBVersion = 3;
  let dbVersion = latestDBVersion;

  if (!prepare('SELECT * FROM dbversion').get()) {
    prepare('INSERT INTO dbversion (version) VALUES (?)').run(latestDBVersion);
  } else {
    dbVersion = (prepare('SELECT * FROM dbversion').get() as DBVersion).version;
  }

  if (dbVersion === 1) {
    // add status roles
    // add activeTemporaryRoles
    // fade out currentlyActiveActivites
    prepare('UPDATE dbversion SET version = 2').run();
    dbVersion = 2;
  }
  if (dbVersion === 2) {
    prepare("DELETE FROM activityStats WHERE activityName = 'Custom Status'").run();
    prepare('UPDATE dbversion SET version = 3').run();
    dbVersion = 3;
  }

  //TODO: add bot version?
  if (dbVersion > latestDBVersion) {
    log.warn(
      `Database version: ${dbVersion}. The latest known database version is ${latestDBVersion}! Are you opening a database created with a newer version?`,
    );
  } else {
    log.info(`Database version: ${dbVersion}`);
  }
}

export function hashUserID(userID: string): string {
  return createHash('sha256').update(userID).digest('base64');
}

export function getUserConfig(userID: string): DBUser {
  const userIDHash = createHash('sha256').update(userID).digest('base64');
  const user = prepare('SELECT * FROM users WHERE userIDHash = ?').get(userIDHash) as DBUser;
  if (user) return user;
  prepare('INSERT INTO users VALUES (?, ?, ?)').run(userIDHash, 1, 'none');
  return { userIDHash: userIDHash, autoRole: 1, language: 'none' };
}

export function getGuildConfig(guildID: string): DBGuild {
  const guild = prepare('SELECT * FROM guilds WHERE guildID = ?').get(guildID) as DBGuild;
  if (guild) return guild;
  prepare('INSERT INTO guilds VALUES (?, ?, NULL)').run(guildID, 'en-US');
  return { guildID: guildID, language: 'en-US', requiredRoleID: null };
}

export function getActivityRoles(guildID: string): DBActivityRole[] {
  return db
    .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
    .all(guildID) as DBActivityRole[];
}

export function getStatusRoles(guildID: string): DBStatusRole[] {
  return prepare('SELECT * FROM statusRoles WHERE guildID = ?').all(guildID) as DBStatusRole[];
}

export function getLang(interaction: CommandInteraction | StringSelectMenuInteraction): string {
  const userLang = getUserConfig(interaction.user.id).language;
  if (userLang !== 'none') return userLang;

  if (!interaction.guild) return 'en-US';

  return getGuildConfig(interaction.guild.id).language;
}

export async function addActivity(guildID: string, activityName: string) {
  prepare(
    'INSERT INTO activityStats VALUES (?, ?, ?) ON CONFLICT(guildID, activityName) DO UPDATE SET count = count + 1',
  ).run(guildID, activityName, 1);
}

export function getUserCount(): number {
  return (prepare('SELECT COUNT(*) FROM users').get() as { 'COUNT(*)': number })['COUNT(*)'];
}

export function getActivityRoleCount(): number {
  return (prepare('SELECT COUNT(*) FROM activityRoles').get() as { 'COUNT(*)': number })[
    'COUNT(*)'
  ];
}

export function getStatusRoleCount(): number {
  return (prepare('SELECT COUNT(*) FROM statusRoles').get() as { 'COUNT(*)': number })['COUNT(*)'];
}

export function getCurrentlyActiveActivityCount(): number {
  return (
    prepare('SELECT COUNT(*) FROM currentlyActiveActivities').get() as { 'COUNT(*)': number }
  )['COUNT(*)'];
}

export function getTempRoleCount(): number {
  return (
    prepare('SELECT COUNT(*) FROM activityRoles WHERE live = 1').get() as { 'COUNT(*)': number }
  )['COUNT(*)'];
}

export function getPermRoleCount(): number {
  return (
    prepare('SELECT COUNT(*) FROM activityRoles WHERE live = 0').get() as { 'COUNT(*)': number }
  )['COUNT(*)'];
}

export function getRolesCount(): number {
  return getActivityRoleCount() + getStatusRoleCount();
}
