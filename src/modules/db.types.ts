import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface ActiveTemporaryRoles {
  guildID: string;
  roleID: string;
  userID: string;
}

export interface ActiveTemporaryRolesHashed {
  guildID: string;
  roleID: string;
  userIDHash: string;
}

export interface ActivityRoles {
  activityName: string;
  exactActivityName: Generated<boolean>;
  guildID: string;
  permanent: Generated<boolean>;
  roleID: string;
}

export interface ActivityStats {
  activityName: string;
  count: Generated<number>;
  guildID: string;
}

export interface Guilds {
  guildID: string;
  requiredRoleID: string | null;
}

export interface StatusRoles {
  guildID: string;
  roleID: string;
  type: number;
}

export interface Users {
  autorole: Generated<boolean>;
  userID: string;
}

export interface UsersHashed {
  autorole: Generated<boolean>;
  userIDHash: string;
}

export interface DB {
  activeTemporaryRoles: ActiveTemporaryRoles;
  activeTemporaryRolesHashed: ActiveTemporaryRolesHashed;
  activityRoles: ActivityRoles;
  activityStats: ActivityStats;
  guilds: Guilds;
  statusRoles: StatusRoles;
  users: Users;
  usersHashed: UsersHashed;
}