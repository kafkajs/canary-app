FROM node:12-alpine AS builder
RUN apk update && apk add curl bash
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src src
RUN npm run build
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin
RUN npm prune --production
RUN /usr/local/bin/node-prune

FROM node:12-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
RUN chown node:node . && apk add --no-cache tini
USER node
COPY --from=builder /usr/src/app/node_modules/ node_modules/
COPY config config
COPY --from=builder /usr/src/app/build/ build/
ENV PORT 3000
EXPOSE 3000
HEALTHCHECK --interval=3s --timeout=3s --start-period=30s CMD node build/bin/healthcheck.js
ENTRYPOINT [ "/sbin/tini","--", "node", "build/index.js" ]