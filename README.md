# Activity Roles
[![](https://img.shields.io/static/v1?style=flat&logo=discord&logoColor=FFF&label=&message=invite%20me&color=7289DA)](https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot)
[![](https://img.shields.io/static/v1?style=flat&logo=discord&logoColor=FFF&label=&message=join%20support%20guild&color=7289DA)](https://discord.gg/3K9Yx4ufN7)
[![](https://img.shields.io/github/license/tippf3hlr/activity-roles)](./LICENSE)
[![](https://img.shields.io/github/issues/tippf3hlr/activity-roles)](https://github.com/tippf3hlr/activity-roles/issues)
[![](https://img.shields.io/github/package-json/v/tippf3hlr/activity-roles)](https://github.com/tippf3hlr/activity-roles#changelog)\
A Discord bot that gives and removes roles to/from users depending on their discord presence.\
It can be decided for each role if the role should be removed when the user stops playing the game (live mode) or not.\
Ideal for creating specific-game(s)-only channels. The bot is in active development, so if you need anything, feel free to join my [support guild](https://discord.gg/3K9Yx4ufN7) or open an [issue](https://github.com/tippf3hlr/activity-roles/issues/new)\
Inspired by [Game Roles](https://top.gg/bot/511010215290863636).

## Vocabulary
  
  - **activityName:** the name of a discord presence.
  - **exactActivityName:** if activityName can be part of a discord presence, for example the game role with the activityName `Chrom` would give a role to a user who has `Google Chrome` or `Chromium` (or both) in their activities.

## Philosophy (and functioning)

  - The bot collects all discord presences from users and stores them in its database.
  - The account data is not specific to guilds, so if a user joins a new guild with activity roles that match that users activities, the roles will be added right away without the need of opening all games, so they are showed in the guild

## Help

I always try to make things self-explanatory, but if something is unclear feel free to join my [support guild](https://discord.gg/3K9Yx4ufN7) or open an [issue](https://github.com/tippf3hlr/activity-roles/issues/new).

## Privacy

To function properly, the bot needs to store activities linked to discord account IDs in its database. The data is stored securely and will never be used for any purpose other than the bot's functioning.

Additionally, you can completely opt out of the collection with `/toggleAutoRole` and manage your activities yourself if you wish to still get the roles.

## Contribution

Any form of contribution is highly appreciated, may it be a bug, a PR or a feature request.\
Help about the project structure can be found in [architecture.md](./architecture.md).
