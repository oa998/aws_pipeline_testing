#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CDKTestingStack } from '../lib/cdk-testing-stack';
import { ACC_ID, REGION } from '../lib/cdk-testing-stack';
import { MysqlStack } from '../lib/mysql-stack';
import { AwsCdkWithTypescriptFoundationsStack } from '../lib/eks-fargate-stack';

const app = new cdk.App();
// new CDKTestingStack(app, 'CDKTestingStack', {
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

new AwsCdkWithTypescriptFoundationsStack(app, 'eks-fargate-small')

app.synth();
