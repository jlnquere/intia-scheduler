#stage 0: install production dependencies
FROM node:17-alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --production --frozen-lockfile

#stage 1: build source
FROM node:17-alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile
COPY src/ ./src/
COPY tsconfig.json .
RUN yarn build

#stage 2 : copy files (production dependancies from stage #0 and built code from stage #1)
FROM node:17-alpine
RUN apk --no-cache add curl

WORKDIR /app
COPY --from=0 /app .
COPY config ./config
COPY --from=1 /app/dist ./dist
COPY ./health.sh /app/health.sh

ENV EXPOSEDPORT=3000
ENV SERVER_PORT=$EXPOSEDPORT

# By default: build number = 0. If defined in env, we'll send the value to the container
ARG BUILD_NUMBER=0
ENV BUILD_NUMBER=$BUILD_NUMBER
EXPOSE $EXPOSEDPORT
WORKDIR /app
CMD yarn start
HEALTHCHECK --interval=12s --timeout=12s --start-period=30s \  
    CMD /app/health.sh