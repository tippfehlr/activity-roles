import fs from 'fs'
import sqlite3 from 'better-sqlite3';
import { createHash } from 'crypto';
import { CommandInteraction, Locale } from 'discord.js';

export interface DBUser {
  userIDHash: string;
  autoRole: 1 | 0;
  language: Locale | 'none';
}
export interface DBGuild {
  guildID: string;
  language: Locale;
}
export interface DBActivityRole {
  guildID: string;
  activityName: string;
  roleID: string;
  exactActivityName: 1 | 0;
  live: 1 | 0;
}
export interface DBCurrentlyActiveActivity {
  userIDHash: string;
  guildID: string;
  activityName: string;
}

export let db: sqlite3.Database;

export function prepareDB() {
  if (!fs.existsSync('db')) fs.mkdirSync('db');
  db = new sqlite3('db/activity-roles.db');

  db.prepare(
    'CREATE TABLE IF NOT EXISTS users (userIDHash TEXT PRIMARY KEY, autoRole INTEGER, language TEXT)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS guilds (guildID TEXT PRIMARY KEY, language TEXT)'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS activityRoles (guildID TEXT, activityName TEXT, roleID TEXT, exactActivityName INTEGER, live INTEGER, PRIMARY KEY (guildID, activityName, roleID))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS currentlyActiveActivities (userIDHash TEXT, guildID TEXT, activityName TEXT, PRIMARY KEY (userIDHash, guildID, activityName))'
  ).run();
}

/** @deprecated use getUserConfig instead*/
export function getUserAutoRole(userID: string): boolean {
  const userIDHash = createHash('sha256').update(userID).digest('base64');
  const user = db.prepare('SELECT * FROM users WHERE userIDHash = ?').get(userIDHash) as DBUser;
  if (user) return Boolean(user.autoRole);
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run(userIDHash, 1, 'none');
  return true;
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
  db.prepare('INSERT INTO guilds VALUES (?, ?)').run(guildID, 'en-US');
  return { guildID: guildID, language: 'en-US' as Locale };
}

export function getActivityRoles(guildID: string): DBActivityRole[] {
  return db
    .prepare('SELECT * FROM activityRoles WHERE guildID = ?')
    .all(guildID) as DBActivityRole[];
}

export function getLang(interaction: CommandInteraction): Locale {
  const userLang = getUserConfig(interaction.user.id).language;
  if (userLang !== 'none') return userLang;

  if (!interaction.guild) return 'en-US' as Locale;

  return getGuildConfig(interaction.guild.id).language;
}
