FROM --platform=$BUILDPLATFORM node:19-alpine AS build

WORKDIR /activity-roles/

RUN apk add python3 make g++
RUN yarn global add typescript

COPY tsconfig.json .
COPY package.json yarn.lock .

RUN yarn install

COPY src src

RUN tsc --outDir out/


FROM node:19-alpine AS release

WORKDIR /activity-roles/
RUN apk add python3 make g++

COPY img/discord-header.png img/discord-header.png
COPY locales locales

COPY package.json yarn.lock .
RUN yarn install --prod


COPY --from=build /activity-roles/out src


CMD ["node", "src/index.js"]
