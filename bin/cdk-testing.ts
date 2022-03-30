#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CDKTestingStack } from '../lib/cdk-testing-stack';
import { ACC_ID, REGION } from '../lib/cdk-testing-stack';

const app = new cdk.App();
new CDKTestingStack(app, 'CDKTestingStack', {
  env: {
    account: ACC_ID,
    region: REGION,
  }
});

app.synth();
