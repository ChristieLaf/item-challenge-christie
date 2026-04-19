#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') || 'dev';

new InfrastructureStack(app, 'InfrastructureStack', {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
