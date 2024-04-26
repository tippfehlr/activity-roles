import { Selectable } from 'kysely';
import { ActivityRoles } from './db.types';
import { Guild } from 'discord.js';
import { __ } from './messages';
import { table } from 'table';

export function createActivityRolesTable({
  activityRoles,
  guild,
  locale,
}: {
  activityRoles: Selectable<ActivityRoles>[];
  guild: Guild;
  locale: string;
}) {
  const array = [
    [
      '#',
      __({ phrase: 'Role', locale }),
      __({ phrase: 'Activity', locale }),
      __({ phrase: 'Exact Activity Name', locale }),
      __({ phrase: 'Permanent', locale }),
    ],
  ];
  for (const i in activityRoles) {
    array.push([
      String(Number(i) + 1),
      guild.roles.cache.find(role => role.id === activityRoles[i].roleID)?.name +
        ` <@&${activityRoles[i].roleID}>`,
      activityRoles[i].activityName,
      String(activityRoles[i].exactActivityName),
      String(activityRoles[i].permanent),
    ]);
  }
  return table(array, {
    drawHorizontalLine: (index: number) => {
      return index === 0 || index === 1 || index === array.length;
    },
  });
}
