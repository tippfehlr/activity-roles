![](./img/header.png)
[![](https://img.shields.io/static/v1?style=for-the-badge&logo=discord&logoColor=FFF&label=&message=invite%20me&color=7289DA)](https://discord.com/api/oauth2/authorize?client_id=813130993640013874&permissions=8&scope=bot%20applications.commands)
[![](https://img.shields.io/static/v1?style=for-the-badge&logo=discord&logoColor=FFF&label=&message=join%20support%20guild&color=7289DA)](https://discord.gg/3K9Yx4ufN7)
[![](https://img.shields.io/github/license/tippf3hlr/activity-roles?style=for-the-badge)](./LICENSE)
[![](https://img.shields.io/github/issues/tippf3hlr/activity-roles?style=for-the-badge)](https://github.com/tippf3hlr/activity-roles/issues?style=for-the-badge)
![](https://img.shields.io/github/package-json/v/tippf3hlr/activity-roles?style=for-the-badge)  
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

Contribution is highly appreciated. Feel free to join the support/suggestions server and open an issue or pull request.

#### Thanks to these people for suggestions:

 - @EianLee#7234 on Discord
 - @Krampus#2007 on Discord
 - @RstY_CZ#2033 on Discord
 - @dangerBEclose#1654 on Discord
 - @skyykc#0218 on Discord
 - @Mann#9999 on Discord

If I forgot you, please let me know!


Made with ❤️ by tippfehlr.
