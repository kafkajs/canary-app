#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KafkaJSCanaryStack } from '../lib/service-stack';
import { KafkaJSRegistryStack } from '../lib/registry-stack';

const app = new cdk.App();

const { registry } = new KafkaJSRegistryStack(app, 'RegistryStack');
new KafkaJSCanaryStack(app, 'AppStack', { registry, parameterStorePrefix: '/kafkajs-canary-app' });
