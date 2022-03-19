# Architecture

Execution starts at [src/index.ts](./src/index.ts) which
  1. starts the mongoose database and *then*
  2. starts the discord bot

  - [src/modules/bot.ts](./src/modules/bot.ts) and [src/modules/commands/](./src/modules/commands/) (for commands) are for direct interaction with discord.
  - [src/modules/db.ts](./src/modules/db.ts) communicates with MongoDB and provides an interface to the database.
  - [src/modules/messages.ts](./src/modules/messages.ts) contains strings and embeds that get send to the user (maybe also for translation sometime).


## Access diagram

**src** is [src/index.ts](./src/index.ts): [architecture.svg](./architecture.svg) \
[src/modules/commands/](./src/modules/commands/) is used by [wokcommands](https://github.com/AlexzanderFlores/WOKCommands) and therefore by [bot.ts](./src/modules/bot.ts), but it isn't shown on the diagram.