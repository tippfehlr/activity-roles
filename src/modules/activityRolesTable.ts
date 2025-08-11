// SPDX-License-Identifier: AGPL-3.0-only

import { Selectable } from 'kysely';
import { ActivityRoles } from './db.types';
import { Guild } from 'discord.js';
import { __n, __ } from './messages';
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
			__({ phrase: 'Role', locale }),
			__({ phrase: 'Activity', locale }),
			__({ phrase: 'Exact', locale }),
			__({ phrase: 'Permanent', locale }),
			__({ phrase: 'Remove roles', locale }),
			__({ phrase: 'State', locale }),
			__({ phrase: 'Details', locale }),
			__({ phrase: 'Role id', locale }),
		],
	];
	for (const r of activityRoles) {
		array.push([
			guild.roles.cache.find(role => role.id === r.roleID)?.name ?? '',
			r.activityName,
			String(r.exact),
			String(r.permanent),
			r.removeAfterDays
				? __n({
						singular: 'after %s day',
						plural: 'after %s days',
						locale,
						count: r.removeAfterDays,
					})
				: __({ phrase: 'never', locale }),
			r.state,
			r.details,
			r.roleID,
		]);
	}
	return table(array, {
		drawHorizontalLine: (index: number) => {
			return [0, 1, array.length].includes(index);
		},
	});
}
