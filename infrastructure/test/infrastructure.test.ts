import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { KafkaJSCanaryStack } from '../lib/service-stack';
import { KafkaJSRegistryStack } from '../lib/registry-stack';

test('Empty Stack', () => {
  const app = new cdk.App();

  const registryStack = new KafkaJSRegistryStack(app, 'TestRegistryStack');
  const stack = new KafkaJSCanaryStack(app, 'TestStack', {
    registry: registryStack.registry,
    parameterStorePrefix: '/test-prefix',
  });

  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {},
      },
      MatchStyle.EXACT,
    ),
  );
});
