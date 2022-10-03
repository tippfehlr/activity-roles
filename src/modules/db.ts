import sqlite3 from 'better-sqlite3';
import { createHash } from 'crypto';

export interface ActivityRoles {
  guildID: string;
  activityName: string;
  roleID: string;
  exactActivityName: 1 | 0;
  live: 1 | 0;
}

export interface Users {
  userIDHash: string;
  autoRole: 1 | 0;
}

export interface CurrentlyActiveActivities {
  userID: string;
  guildID: string;
  activityName: string;
}

export const db = sqlite3('activity-roles.db');

export function prepareDB() {
  db.prepare('CREATE TABLE IF NOT EXISTS users (userID TEXT PRIMARY KEY, autoRole INTEGER)').run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS activityRoles (guildID TEXT, activityName TEXT, roleID TEXT, exactActivityName INTEGER, live INTEGER, PRIMARY KEY (guildID, activityName, roleID))'
  ).run();
  db.prepare(
    'CREATE TABLE IF NOT EXISTS currentlyActiveActivities (userID TEXT, guildID TEXT, activityName TEXT, PRIMARY KEY (userID, guildID, activityName))'
  ).run();
}

export function getUserAutoRole(userID: string): boolean {
  const userIDHash = createHash('sha256').update(userID).digest('base64');
  const user = db.prepare('SELECT * FROM users WHERE userID = ?').get(userIDHash);
  if (user) return Boolean(user.autoRole);
  db.prepare('INSERT INTO users VALUES (?, ?)').run(userIDHash, 1);
  return true;
}

export function getActivityRoles(guildID: string): ActivityRoles[] {
  return db.prepare('SELECT * FROM activityRoles WHERE guildID = ?').all(guildID);
}
