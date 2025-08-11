// SPDX-License-Identifier: AGPL-3.0-only

import { ColorResolvable } from 'discord.js';
import { log } from './messages';

const missingEnv = (env: string) => {
	log.error(`Environment variable ${env} not provided.`);
	process.exit(1);
};

const TOKEN = process.env.TOKEN;
if (!TOKEN) missingEnv('TOKEN');

const APPLICATION_ID = process.env.APPLICATION_ID;
if (!APPLICATION_ID) missingEnv('APPLICATION_ID');

const HOSTER_NAME = process.env.HOSTER_NAME;
if (!HOSTER_NAME) missingEnv('HOSTER_NAME');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) missingEnv('DATABASE_URL');

const INVITE_LINK = `https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=268435456&scope=bot%20applications.commands`;
const COLOR = (process.env.COLOR || '#3695d3') as ColorResolvable;
const SUPPORT_GUILD_LINK = 'https://discord.gg/3K9Yx4ufN7';
const AUTHOR_LOGO_LINK = 'https://drive.google.com/uc?id=1c-jP8Znqm72U2kEhoOdP-DzFvpiyJnvd';
const AUTHOR = 'tippfehlr#3575';
const GUILD: string | false = process.env.GUILD || false;

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORG = process.env.INFLUX_ORG;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;

const SKIP_COMMAND_UPLOAD = process.env.SKIP_COMMAND_UPLOAD;

export default {
	TOKEN: TOKEN as string,
	APPLICATION_ID: APPLICATION_ID as string,
	HOSTER_NAME: HOSTER_NAME as string,
	DATABASE_URL: DATABASE_URL as string,
	INVITE_LINK,
	COLOR,
	SUPPORT_GUILD_LINK,
	AUTHOR_LOGO_LINK,
	AUTHOR,
	GUILD,
	INFLUX_URL,
	INFLUX_TOKEN,
	INFLUX_ORG,
	INFLUX_BUCKET,
	SKIP_COMMAND_UPLOAD,
};
