FROM node:19-alpine AS build

WORKDIR /activity-roles/

COPY package.json yarn.lock .
RUN apk add python3 make g++

RUN yarn global add typescript
RUN yarn install
COPY tsconfig.json .

COPY src src

RUN tsc --outDir out/


FROM node:19-alpine AS release

RUN apk add python3 make g++
WORKDIR /activity-roles/

COPY package.json yarn.lock .
RUN yarn install --prod

COPY locales locales
COPY img/discord-header.png img/discord-header.png

COPY --from=build /activity-roles/out src


CMD ["node", "src/index.js"]
