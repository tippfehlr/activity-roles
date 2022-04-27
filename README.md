# Activity Roles
[![](https://img.shields.io/static/v1?style=flat&logo=discord&logoColor=FFF&label=&message=invite%20me&color=7289DA)](https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot)
[![](https://img.shields.io/static/v1?style=flat&logo=discord&logoColor=FFF&label=&message=join%20support%20guild&color=7289DA)](https://discord.gg/3K9Yx4ufN7)
[![](https://img.shields.io/github/license/tippf3hlr/activity-roles)](./LICENSE)
[![](https://img.shields.io/github/issues/tippf3hlr/activity-roles)](https://github.com/tippf3hlr/activity-roles/issues)
[![](https://img.shields.io/github/package-json/v/tippf3hlr/activity-roles)](https://github.com/tippf3hlr/activity-roles#changelog)
[![](https://img.shields.io/librariesio/github/tippf3hlr/activity-roles)](https://libraries.io/github/tippf3hlr/activity-roles)\
A discord bot that gives and removes roles from users dependent on their discord presence, but unlike other bots it doesn't remove them if you stop playing.\
Intended to show which people play what game and therefore give them access to specific channels etc.\
Inspired by [Game Roles](https://top.gg/bot/511010215290863636).

## Vocabulary
  
  - **activityName:** the name of a discord presence.
  - **exactActivityName:** if activityName can be part of a discord presence, for example the game role with the activityName `Chrom` would give a role to a user who has `Google Chrome` or `Chromium` (or both) in their activities.

## Philosophy (and functioning)

  - The bot collects all discord presences from users and stores them in its database.
  - The account data is not specific to guilds, so if a user joins a new guild with activity roles that match that users activities, the roles will be added right away without the need of opening all games, so they are showed in the guild

## Help

I always try to make things self-explanatory, but if something is unclear feel free to open an issue or message me on Discord (tippfehlr#3575)

## Privacy

The bot has activity data linked to discord accounts, but **I will never do anything with that data that differs from the intended usage from the bot (except looking at it and being sad because nobody uses it).**

Additionally, you can completely opt out of the collection with `/toggleAutoRole` and manage your activities yourself if you wish to still get the roles.

## Contribution

Any form of contribution is highly appreciated, may it be a bug, a PR or a feature request.\
Help about the project structure can be found in [architecture.md](./architecture.md).

## License

![AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-orange?style=for-the-badge)

## Changelog

![](https://img.shields.io/badge/version-v1.2.0-blue?style=for-the-badge)\
Add `/activityStats`: Shows activities in this guild.

![](https://img.shields.io/badge/version-v1.1.2-blue?style=for-the-badge)\
Make the not exact activity names non-case-sensitive