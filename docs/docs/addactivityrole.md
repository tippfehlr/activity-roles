# `addactivityrole` command
[back](https://tippfehlr.github.io/activity-roles/)

## `/addactivityrole <activity> [<role> <exact_activity_name> <permanent> <remove_after_days>]`

### required
* `<activity>` - Represent what activity the bot should look for when assigning a role.
### optional
* `<role>` - If not provided, the bot will look for roles with the same name or create a new one.
* `<exact_activity_name>` - If false, the activity name 'Chrome' would also trigger for 'Google Chrome'.
* `<permanent>` - the role will not be removed again if set to true.
  * `<remove_after_days>` - remove roles again after x days with no activity. Only works with permanent = true.[*](https://discord.gg/UvpVgX9M5j "at the time of the writing of this doc (02/16/25`) this isnt working, keep an eye into the support server for news about this")

## FAQ
1. **The bot are'nt working, what can i do?** first, you can look to see if the bot is in a role higher than the role you are trying to give, second, if the role was gaven to someone manually, the bot will not work, if any of that worked for you, head to [support discord server](https://discord.gg/UvpVgX9M5j)
2. **can the bot take a role after someone stop playing it?** yes! just set `<pemanent>` to false and you should be good to go!

