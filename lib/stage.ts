import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";

export class MyPipelineAppStage extends cdk.Stage {
  constructor(scope: Construct, stageName: string, props?: cdk.StageProps) {
    super(scope, stageName, props);
  }
}
