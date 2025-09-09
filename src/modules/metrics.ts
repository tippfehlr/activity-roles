// SPDX-FileCopyrightText: 2021 tippfehlr <tippfehlr@tippfehlr.dev>
// SPDX-License-Identifier: AGPL-3.0-or-later

import prom from 'prom-client';
import http from 'node:http';

import { client } from './bot';
import { log } from './messages';

import { getTempRoleCount, getPermRoleCount, getRowCount, db } from './db';
import config from './config';

const metricsPublic = {
	checkroles: new prom.Counter({
		name: 'activityroles_checkroles_total',
		help: 'The number of times checkroles was executed for a guild',
		labelNames: ['guildId'],
	}),
	checkrolesRolesModified: new prom.Counter({
		name: 'activityroles_checkroles_roles_modified_total',
		help: 'The number of roles that were added/removed by checkroles',
		labelNames: ['action'], // add, remove
	}),
	commands: new prom.Counter({
		name: 'activityroles_commands_total',
		help: 'The number of commands that were executed',
		labelNames: ['locale'],
	}),
	presenceUpdateDuration: new prom.Histogram({
		name: 'activityroles_presence_update_duration_seconds',
		help: 'The time a presence update takes',
		buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
	}),
	presenceUpdates: new prom.Counter({
		name: 'activityroles_presence_updates_total',
		help: 'The number of presence updates the bot received',
	}),
	rolesModified: new prom.Counter({
		name: 'activityroles_roles_modified_total',
		help: 'The number of roles that were added or removed',
		labelNames: ['action'], // add_permanent, add_temporary, remove
	}),
	websocketErrors: new prom.Counter({
		name: 'activityroles_websocket_errors_total',
		help: 'The number of websocket errors',
	}),
};
export default metricsPublic;

const metricsAll = {
	guilds: new prom.Gauge({
		name: 'activityroles_guilds',
		help: 'The total number of guilds',
		labelNames: ['source'],
		async collect() {
			this.set({ source: 'cache' }, client.guilds.cache.size);
			this.set({ source: 'database' }, await getRowCount('guilds'));
		},
	}),
	roles: new prom.Gauge({
		name: 'activityroles_roles',
		help: 'The total number of roles in the database',
		labelNames: ['type'],
		async collect() {
			this.set({ type: 'temporary' }, await getTempRoleCount());
			this.set({ type: 'permanent' }, await getPermRoleCount());
			this.set({ type: 'status' }, await getRowCount('statusRoles'));
		},
	}),
	users: new prom.Gauge({
		name: 'activityroles_users',
		help: 'The total number of users',
		labelNames: ['source'],
		async collect() {
			this.set({ source: 'cache' }, client.users.cache.size);
			this.set({ source: 'database_hashed' }, await getRowCount('usersHashed'));
			this.set({ source: 'database' }, await getRowCount('users'));
		},
	}),
	usersAutoroleDisabled: new prom.Gauge({
		name: 'activityroles_users_autorole_disabled',
		help: 'The number of users who disabled autorole',
		async collect() {
			this.set(
				Number(
					(
						await db
							.selectFrom('users')
							.where('autorole', '=', false)
							.select(eb => eb.fn.countAll().as('count'))
							.executeTakeFirstOrThrow()
					).count,
				),
			);
		},
	}),
	activeTemporaryRoles: new prom.Gauge({
		name: 'activityroles_active_temporary_roles',
		help: 'The number of active temporary roles',
		labelNames: ['source'],
		async collect() {
			this.set(
				{ source: 'database_hashed' },
				await getRowCount('activeTemporaryRolesHashed'),
			);
			this.set({ source: 'database' }, await getRowCount('activeTemporaryRoles'));
		},
	}),
	...metricsPublic,
};

export async function initMetrics() {
	const register = new prom.Registry();

	for (const metric of Object.values(metricsAll)) {
		register.registerMetric(metric);
	}

	prom.collectDefaultMetrics({ register, prefix: 'activityroles_' });

	const server = http.createServer(async (req, res) => {
		log.debug(req.url);

		if (req.url === '/metrics') {
			res.setHeader('Content-Type', register.contentType);
			res.end(await register.metrics());
		}
	});
	// Start the HTTP server which exposes the metrics on http://localhost:8080/metrics
	server.listen(config.METRICS_PORT);

	prom.collectDefaultMetrics();

	http.createServer(async (req, res) => {
		if (req.url === '/metrics') {
			res.end(await register.metrics());
		}
	});
	log.info(`Metrics listening on http://0.0.0.0:${config.METRICS_PORT}/metrics`);
}
