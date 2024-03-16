# https://stackoverflow.com/a/58487433
# To prevent cache invalidation from changes in fields other than dependencies

FROM endeveit/docker-jq AS jq
COPY package.json /tmp
RUN jq '{ dependencies, devDependencies }' < /tmp/package.json > /tmp/deps.json

FROM oven/bun AS base
WORKDIR /activity-roles

FROM base AS build
# RUN mkdir -p /temp/dev
# COPY --from=jq /tmp/deps.json /temp/dev/package.json
# COPY bun.lockb /temp/dev/bun.lockb
# RUN /temp/dev && bun install --frozen-lockfile

COPY --from=jq /tmp/deps.json ./package.json
COPY bun.lockb bun.lockb
RUN bun install --frozen-lockfile --production

FROM base AS release
COPY --from=build /activity-roles/node_modules node_modules
COPY img/discord-header.png img/discord-header.png
COPY locales locales
COPY src src

ENV NODE_ENV=production
VOLUME ["/activity-roles/db"]
ENTRYPOINT ["bun", "run", "src/index.ts"]
