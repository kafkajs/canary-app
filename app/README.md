# KafkaJS Canary App

A simple producer-consumer that is intended to try out beta versions of KafkaJS.

## Running the service locally

See [custom-environment-variables.json](./config/custom-environment-variables.json) for environment variables
that you can set.

```sh
# Copy the example environment variables and load them
$ cp .env.example .env
$ source .env

$ npm install

# Run Kafka locally
$ docker-compose up -d

$ npm start
```

## Running in Docker

```sh
$ docker build . -t kafkajs-canary-app:latest
$ docker run -p 3000:3000 --rm kafkajs-canary-app:latest
```

## Deployment

See [infrastructure/README.md](../infrastructure/README.md#Deploying) for instructions on how to deploy the app to AWS. In general, you need to:

1. Build a new Docker image
2. Tag it
3. Push it to ECR
4. Deploy the CDK AppStack with the image tag as the `version` parameter.