#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CDKTestingStack, ACC_ID, REGION } from '../lib/cdk-testing-stack';
import { MysqlStack } from '../lib/mysql-stack';
import { AwsCdkWithTypescriptFoundationsStack } from '../lib/eks-fargate-stack';
import { IamStack } from '../lib/iam-stack';
import { ECSStack } from '../lib/ECSStack';

const app = new cdk.App();

// new CDKTestingStack(app, 'pipeline-stack', {
//   env: {
//     account: ACC_ID,
//     region: REGION,
//   }
// });

new MysqlStack(app, 'mysql-db-stack', {
  env: {
    account: ACC_ID,
    region: REGION,
  }
});

new AwsCdkWithTypescriptFoundationsStack(app, 'eks-stackabc', {
  env: {
    account: ACC_ID,
    region: REGION,
  }
})

new IamStack(app, 'iam-group-stack', {
  env: {
    account: ACC_ID,
    region: REGION,
  }
});

new ECSStack(app, 'ecs-stack-zach', {
  clientName: 'client-zach',
  environment: 'env-zach',
  domain: 'halfpalace.com',
  taskEnv: undefined,
  env: {
    account: ACC_ID,
    region: REGION,
  }
})

app.synth();
