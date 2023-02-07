![](./img/header.png)
[![](https://img.shields.io/static/v1?style=for-the-badge&logo=discord&logoColor=FFF&label=&message=invite%20me&color=7289DA)](https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot%20applications.commands)
[![](https://img.shields.io/discord/958393035543175258?label=support&logo=DISCORD&style=for-the-badge)](https://discord.gg/3K9Yx4ufN7)
[![](https://img.shields.io/github/license/tippf3hlr/activity-roles?style=for-the-badge)](./LICENSE)
![](https://img.shields.io/github/package-json/v/tippf3hlr/activity-roles?style=for-the-badge)
![GitHub last commit](https://img.shields.io/github/last-commit/tippf3hlr/activity-roles?style=for-the-badge) 
---
A Discord bot for automatic role assignment based on activities.  
Support/Suggestions: https://discord.gg/3K9Yx4ufN7.  
Inspired by [Game Roles](https://top.gg/bot/511010215290863636).

---
If you add an activity role with `/addactivityrole`, the bot will start looking for activities with the specified name. If a user starts an activity with that name, the bot will add the role to the user.

If `exact_activity_name` is set to false, the activity name `Chrome` would also trigger for `Google Chrome`.  
If it is true, the activity must match exactly and case-sensitively.

If you set `live` to true, the bot will remove the role from users who got the role from the bot and don't have the activity anymore.  
**The bot will not remove any roles that were added manually.**

Further help is available via the `/help` command and in the support server.

## Privacy

User IDs are only stored as a sha256 hash to allow users to disable the bot for them.  
No activity data ist stored.

## Contribution
<!--[![](https://img.shields.io/static/v1?style=for-the-badge&logo=discord&logoColor=FFF&label=&message=Activity%20Roles%20Nightly&color=bc0058)](https://discord.com/api/oauth2/authorize?client_id=1052651430462357625&permissions=8&scope=bot%20applications.commands)

*This is the nightly (beta) channel of Activity Roles.
This bot is only for testing future features and isn’t guaranteed to be online or working.
The database is separate from stable.  
It updates from the [dev brach](https://github.com/tippf3hlr/activity-roles/tree/dev).* -->

Contribution is highly appreciated. Feel free to join the support/suggestions server and open an issue or pull request.
### Translation

The default language of the bot is English.  
Available translations:

[![Czech translation](https://img.shields.io/badge/dynamic/json?color=blue&label=Czech&style=for-the-badge&logo=crowdin&query=%24.progress.0.data.translationProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-15099081-554085.json)](https://crowdin.com/project/activity-roles/cs)
[![Dutch translation](https://img.shields.io/badge/dynamic/json?color=blue&label=Dutch&style=for-the-badge&logo=crowdin&query=%24.progress.2.data.translationProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-15099081-554085.json)](https://crowdin.com/project/activity-roles/nl)
[![Brazilian Portuguese translation](https://img.shields.io/badge/dynamic/json?color=blue&label=Brazilian%20Portuguese&style=for-the-badge&logo=crowdin&query=%24.progress.3.data.translationProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-15099081-554085.json)](https://crowdin.com/project/activity-roles/pt-BR)
[![German translation](https://img.shields.io/badge/dynamic/json?color=blue&label=German&style=for-the-badge&logo=crowdin&query=%24.progress.1.data.translationProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-15099081-554085.json)](https://crowdin.com/project/activity-roles/de)
[![Russian translation](https://img.shields.io/badge/dynamic/json?color=blue&label=Russian&style=for-the-badge&logo=crowdin&query=%24.progress.4.data.translationProgress&url=https%3A%2F%2Fbadges.awesome-crowdin.com%2Fstats-15099081-554085-update.json)](https://crowdin.com/project/activity-roles/ru)  
Help translate the bot on [Crowdin](https://crowdin.com/project/activity-roles).

#### Thanks:

 - @EianLee#7234
 - @Krampus#2007 **[Brazilian Portuguese]**
 - @RstY_CZ#2033 **[Czech]**
 - @dangerBEclose#1654 **[Dutch]**
 - @skyykc#0218
 - @Mann#9999
 - Hugo Moreira#4306
 - Tillmann Taute **[German]**

If I forgot you, please let me know!


Made with ❤️ by tippfehlr.
