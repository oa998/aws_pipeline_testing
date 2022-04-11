import * as cdk from "aws-cdk-lib";

interface ECSStackProps extends cdk.StackProps {
  clientName: string;
  environment: string;
  domain: string;
  taskEnv: { [key: string]: string } | undefined;
  // vpcId: string;
}

/**
 * EXAMPLE ECS
 *
 * A full provisioned ECS deployment setup
 *
 * Creates all ECS resources from docker containers through to domain configuration
 *
 */
export class ECSStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope: cdk.App, id: string, props: ECSStackProps) {
    super(scope, id, props);

    const clientName = props.clientName;
    const clientPrefix = `${clientName}-${props.environment}-server`;

    const vpc = new cdk.aws_ec2.Vpc(this, `${clientPrefix}-vpc`);

    // const vpc = cdk.aws_ec2.Vpc.fromLookup(this, `${clientPrefix}-vpc`, {
    //   vpcId: props.vpcId,
    // });

    const repository = new cdk.aws_ecr.Repository(this, `${clientPrefix}-repository`, {
      repositoryName: `${clientPrefix}-repository`,
    });

    // The code that defines your stack goes here
    const cluster = new cdk.aws_ecs.Cluster(this, `${clientPrefix}-cluster`, {
      clusterName: `${clientPrefix}-cluster`,
      vpc,
    });

    // load balancer resources
    const elb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(
      this,
      `${clientPrefix}-elb`,
      {
        vpc,
        vpcSubnets: { subnets: vpc.publicSubnets },
        internetFacing: true,
      }
    );

    const zone = cdk.aws_route53.HostedZone.fromLookup(this, `${clientPrefix}-zone`, {
      domainName: props.domain,
    });

    new cdk.aws_route53.ARecord(this, `${clientPrefix}-domain`, {
      recordName: `${
        props.environment !== "production" ? `${props.environment}-` : ""
      }api.${props.domain}`,
      target: cdk.aws_route53.RecordTarget.fromAlias(
        new cdk.aws_route53_targets.LoadBalancerTarget(elb)
      ),
      ttl: cdk.Duration.seconds(300),
      comment: `${props.environment} API domain`,
      zone: zone,
    });

    const targetGroupHttp = new cdk.aws_elasticloadbalancingv2.ApplicationTargetGroup(
      this,
      `${clientPrefix}-target`,
      {
        port: 80,
        vpc,
        protocol: cdk.aws_elasticloadbalancingv2.ApplicationProtocol.HTTP,
        targetType: cdk.aws_elasticloadbalancingv2.TargetType.IP,
      }
    );

    targetGroupHttp.configureHealthCheck({
      path: "/api/status",
      protocol: cdk.aws_elasticloadbalancingv2.Protocol.HTTP,
    });

    const cert = new cdk.aws_certificatemanager.Certificate(
      this,
      `${clientPrefix}-cert`,
      {
        domainName: props.domain,
        subjectAlternativeNames: [`*.${props.domain}`],
        validation: cdk.aws_certificatemanager.CertificateValidation.fromDns(zone),
      }
    );
    const listener = elb.addListener("Listener", {
      open: true,
      port: 443,
      certificates: [cert],
    });

    listener.addTargetGroups(`${clientPrefix}-tg`, {
      targetGroups: [targetGroupHttp],
    });

    const elbSG = new cdk.aws_ec2.SecurityGroup(this, `${clientPrefix}-elbSG`, {
      vpc,
      allowAllOutbound: true,
    });

    elbSG.addIngressRule(
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(443),
      "Allow https traffic"
    );

    elb.addSecurityGroup(elbSG);

    const bucket = new cdk.aws_s3.Bucket(this, `${clientPrefix}-s3-bucket`, {
      bucketName: `${clientName}-${props.environment}-assets`,
    });

    const taskRole = new cdk.aws_iam.Role(this, `${clientPrefix}-task-role`, {
      assumedBy: new cdk.aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${clientPrefix}-task-role`,
      description: "Role that the api task definitions use to run the api code",
    });

    taskRole.attachInlinePolicy(
      new cdk.aws_iam.Policy(this, `${clientPrefix}-task-policy`, {
        statements: [
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: ["S3:*"],
            resources: [bucket.bucketArn],
          }),
          new cdk.aws_iam.PolicyStatement({
            effect: cdk.aws_iam.Effect.ALLOW,
            actions: ["SES:*"],
            resources: ["*"],
          }),
        ],
      })
    );

    const taskDefinition = new cdk.aws_ecs.TaskDefinition(
      this,
      `${clientPrefix}-task`,
      {
        family: `${clientPrefix}-task`,
        compatibility: cdk.aws_ecs.Compatibility.EC2_AND_FARGATE,
        cpu: "256",
        memoryMiB: "512",
        networkMode: cdk.aws_ecs.NetworkMode.AWS_VPC,
        taskRole: taskRole,
      }
    );

    const image = cdk.aws_ecs.RepositoryImage.fromEcrRepository(repository, "latest");

    const container = taskDefinition.addContainer(`${clientPrefix}-container`, {
      image: image,
      memoryLimitMiB: 512,
      environment: props.taskEnv, // These are container ENV, like "DB_HOST"
      logging: cdk.aws_ecs.LogDriver.awsLogs({ streamPrefix: clientPrefix }),
    });

    container.addPortMappings({ containerPort: 80 });

    const ecsSG = new cdk.aws_ec2.SecurityGroup(this, `${clientPrefix}-ecsSG`, {
      vpc,
      allowAllOutbound: true,
    });

    ecsSG.connections.allowFrom(
      elbSG,
      cdk.aws_ec2.Port.allTcp(),
      "Application load balancer"
    );

    const service = new cdk.aws_ecs.FargateService(this, `${clientPrefix}-service`, {
      cluster,
      desiredCount: 1,
      taskDefinition,
      securityGroups: [ecsSG],
      assignPublicIp: true,
    });

    service.attachToApplicationTargetGroup(targetGroupHttp);

    const scalableTaget = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 5,
    });

    scalableTaget.scaleOnMemoryUtilization(`${clientPrefix}-ScaleUpMem`, {
      targetUtilizationPercent: 75,
    });

    scalableTaget.scaleOnCpuUtilization(`${clientPrefix}-ScaleUpCPU`, {
      targetUtilizationPercent: 75,
    });

    // outputs to be used in code deployments
    new cdk.CfnOutput(this, `${props.environment}ServiceName`, {
      exportName: `${props.environment}ServiceName`,
      value: service.serviceName,
    });

    new cdk.CfnOutput(this, `${props.environment}ImageRepositoryUri`, {
      exportName: `${props.environment}ImageRepositoryUri`,
      value: repository.repositoryUri,
    });

    new cdk.CfnOutput(this, `${props.environment}ImageName`, {
      exportName: `${props.environment}ImageName`,
      value: image.imageName,
    });

    new cdk.CfnOutput(this, `${props.environment}ClusterName`, {
      exportName: `${props.environment}ClusterName`,
      value: cluster.clusterName,
    });
  }
}
