import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep, Step } from 'aws-cdk-lib/pipelines';
import { ManualApprovalStep } from 'aws-cdk-lib/pipelines';
import { MyPipelineAppStage } from './stage';

export const ACC_ID = '026406728043';
export const REGION = 'us-east-1';

export class CiCdAwsPipelineDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'TestPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub(
          'oa998/aws_pipeline_testing',
          'main',
          {
            authentication: cdk.SecretValue.secretsManager('demo/pipeline/github-token')
          }
        ),
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      })
    });

    const testingStage = pipeline.addStage(new MyPipelineAppStage(this, "test", {
      env: { account: ACC_ID, region: REGION }
    }));

    testingStage.addPre(new ShellStep("Run Unit Tests", { commands: ['npm install', 'npm test'] }));
    testingStage.addPost(new ManualApprovalStep('Manual approval before production'));

    const prodStage = pipeline.addStage(new MyPipelineAppStage(this, "prod", {
      env: { account: ACC_ID, region: REGION }
    }));
  }
}
