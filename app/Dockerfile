FROM node:12-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY src src
RUN npm run build

FROM node:12-alpine
ENV NODE_ENV=production
RUN apk add --no-cache tini
WORKDIR /usr/src/app
RUN chown node:node .
USER node
COPY package*.json ./
RUN npm install
COPY --from=builder /usr/src/app/build/ build/
COPY config config
EXPOSE 3000
HEALTHCHECK --interval=3s --timeout=3s --start-period=30s CMD node build/bin/healthcheck.js
ENTRYPOINT [ "/sbin/tini","--", "node", "build/index.js" ]