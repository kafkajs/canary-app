# KafkaJS Canary App

This is a simple application that produces and consumes messages to Kafka in order
to validate new beta release versions of KafkaJS.

> **🚧 WIP! 🚧**
> 
> This application is not meant to be for general use. It is made to be as simple as possible,
> to allow us to have an application that can be continously running and alert us only
> if there is an issue with a new version of KafkaJS. It is made specifically for our needs -
> **not to serve as an example for KafkaJS users**.

## Structure

The repo contains two parts:

1. [`app/`](./app) - a simple NodeJS app written in Typescript, producing messages and consuming them.
2. [`infrastructure/`](./infrastructure) - an [AWS CDK]() project to deploy the aformented app as a Fargate service.

To deploy the service, see the respective READMEs. If starting from scratch, the general sequence is:

1. Deploy the registry stack to create the ECR registry
2. Build the app Docker image and push it to ECR
3. Deploy the app stack with the newly pushed tag

## Validation

> **🚧 WIP 🚧**

Whenever there is a new beta version of KafkaJS deployed, a workflow in this repository will be
started, which upgrades the KafkaJS version, builds a new Docker image and deploys the app
with the new version.

The application will continously be producing metrics to Cloudwatch, and alarms will be set up
to alert the KafkaJS Slack if the application is behaving anomalously. KafkaJS maintainers
will have access to the raw metrics and logs to investigate any issues.

Additionally, error reporting to Sentry is set up such that unhandled or unexpected errors
are reported there for investigation.