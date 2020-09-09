#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KafkaJSCanaryStack } from '../lib/service-stack';
import { KafkaJSRegistryStack } from '../lib/registry-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
};

const { registry } = new KafkaJSRegistryStack(app, 'RegistryStack', { env });
new KafkaJSCanaryStack(app, 'AppStack', { registry, parameterStorePrefix: '/kafkajs-canary-app', env });
