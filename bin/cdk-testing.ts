#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CiCdAwsPipelineDemoStack } from '../lib/ci-cd-aws-pipeline-demo-stack';
import { ACC_ID, REGION } from '../lib/cdk-testing-stack';

const app = new cdk.App();
new CiCdAwsPipelineDemoStack(app, 'CiCdAwsPipelineDemoStack', {
  env: {
    account: ACC_ID,
    region: REGION,
  }
});

app.synth();
