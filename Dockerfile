FROM --platform=$BUILDPLATFORM endeveit/docker-jq AS deps

# https://stackoverflow.com/a/58487433
# To prevent cache invalidation from changes in fields other than dependencies

COPY package.json /tmp

RUN jq '{ dependencies, devDependencies }' < /tmp/package.json > /tmp/deps.json


FROM --platform=$BUILDPLATFORM node:current-alpine AS build
WORKDIR /activity-roles/

RUN apk add python3 make g++
RUN yarn global add typescript

COPY tsconfig.json yarn.lock .
COPY --from=deps /tmp/deps.json ./package.json

RUN yarn install

COPY src src

RUN tsc --outDir out/



FROM node:current-alpine AS release
WORKDIR /activity-roles/
RUN apk add python3 make g++

COPY img/discord-header.png img/discord-header.png
COPY locales locales

COPY yarn.lock .
COPY --from=deps /tmp/deps.json ./package.json
RUN yarn install --prod

COPY --from=build /activity-roles/out src

VOLUME ["/activity-roles/db"]
ENTRYPOINT ["node", "src/index.js"]
