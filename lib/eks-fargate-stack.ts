import * as cdk from "aws-cdk-lib";

export class AwsCdkWithTypescriptFoundationsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new cdk.aws_ec2.Vpc(this, 'EKSVpc');  // Create a new VPC for our cluster
    
    // IAM role for our EC2 worker nodes
    const workerRole = new cdk.aws_iam.Role(this, 'EKSWorkerRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      roleName: 'zachs-test-role'
    });

    const eksCluster = new cdk.aws_eks.Cluster(this, 'Cluster', {
      vpc: vpc,
      defaultCapacity: 0,  // we want to manage capacity our selves
      version: cdk.aws_eks.KubernetesVersion.V1_21,
      clusterName: 'development-1'
    });

    const onDemandASG = new cdk.aws_autoscaling.AutoScalingGroup(this, 'OnDemandASG', {
      vpc: vpc,
      role: workerRole,
      minCapacity: 1,
      maxCapacity: 2,
      instanceType: new cdk.aws_ec2.InstanceType('t3.medium'),
      machineImage: new cdk.aws_eks.EksOptimizedImage({
        kubernetesVersion: '1.21',
        nodeType: cdk.aws_eks.NodeType.STANDARD  // without this, incorrect SSM parameter for AMI is resolved
      }),
      updatePolicy: cdk.aws_autoscaling.UpdatePolicy.rollingUpdate()
    });

    eksCluster.connectAutoScalingGroupCapacity(onDemandASG, {});

       // apply a kubernetes manifest to the cluster
    eksCluster.addManifest("mypod", {
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

    eksCluster.addManifest("mypod-lb", {
      apiVersion: "v1",
      kind: "Service",
      metadata: {
        name: "mypod-lb"
      },
      spec: {
        ports: [
          {
            port: 80,
            targetPort: 8080,
            protocol: 'TCP' 
          }
        ],
        type: 'LoadBalancer',
        selector: {
          "app.kubernetes.io/name": "mypod"
        }
      },
    });

    

    new cdk.CfnOutput(this, 'workerRoleName', {
      value: workerRole.roleName,
    });
  }
}
