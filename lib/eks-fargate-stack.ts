import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from "aws-cdk-lib";

export class AwsCdkWithTypescriptFoundationsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // The code that defines your stack goes here
    const cluster = new eks.FargateCluster(this, "HelloEKS", {
     version: eks.KubernetesVersion.V1_20,
     clusterName: "fargate-demo",
   });

  //  cluster.addAutoScalingGroupCapacity('eks-autoscaling-group-id-1', {
  //   instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
  // });

   // apply a kubernetes manifest to the cluster
   cluster.addManifest("mypod", {
      apiVersion: "v1",
      kind: "Pod",
      metadata: { name: "mypod" },
      spec: {
        containers: [
          {
            name: "hello",
            image: "amazon/amazon-ecs-sample",
            ports: [{ containerPort: 8080 }],
          },
        ],
      },
    });
  }
}
