# KafkaJS Canary App

A simple producer-consumer that is intended to try out beta versions of KafkaJS.

## Running the service locally

```sh
$ npm install
$ source .env
$ npm start
```

## Running in Docker

```sh
$ docker build . -t kafkajs-canary-app:latest
$ docker run -p 3000:3000 --rm kafkajs-canary-app:latest
```
