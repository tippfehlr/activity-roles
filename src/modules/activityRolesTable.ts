// SPDX-License-Identifier: AGPL-3.0-only

import { Selectable } from 'kysely';
import { ActivityRoles } from './db.types';
import { Guild } from 'discord.js';
import { __ } from './messages';
import { table } from 'table';
import { __n } from 'i18n';

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
      __({ phrase: 'Role', locale }),
      __({ phrase: 'Activity', locale }),
      __({ phrase: 'Exact Activity Name', locale }),
      __({ phrase: 'Permanent', locale }),
      __({ phrase: 'Remove roles', locale }),
    ],
  ];
  for (const activityRole of activityRoles) {
    array.push([
      guild.roles.cache.find(role => role.id === activityRole.roleID)?.name +
        ` <@&${activityRole.roleID}>`,
      activityRole.activityName,
      String(activityRole.exactActivityName),
      String(activityRole.permanent),
      activityRole.removeAfterDays
        ? __n({
            singular: 'after %s day',
            plural: 'after %s days',
            locale,
            count: activityRole.removeAfterDays,
          })
        : 'never',
    ]);
  }
  return table(array, {
    drawHorizontalLine: (index: number) => {
      return [0, 1, array.length].includes(index);
    },
  });
}
