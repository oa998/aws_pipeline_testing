import * as cdk from 'aws-cdk-lib';

export class MysqlStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 create the VPC
    const vpc = new cdk.aws_ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        }
      ],
    });

    // 👇 create a security group for the EC2 instance
    const ec2InstanceSG = new cdk.aws_ec2.SecurityGroup(this, 'ec2-instance-sg', {
      vpc,
    });

    ec2InstanceSG.addIngressRule(
      // cdk.aws_ec2.Peer.ipv4('75.139.152.35/32'),
      cdk.aws_ec2.Peer.anyIpv4(),
      cdk.aws_ec2.Port.tcp(3306),
      'allow connections from my computer on port 3306',
    );

    // 👇 create the EC2 instance
    // const ec2Instance = new cdk.aws_ec2.Instance(this, 'ec2-instance', {
    //   vpc,
    //   vpcSubnets: {
    //     subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
    //   },
    //   securityGroup: ec2InstanceSG,
    //   instanceType: cdk.aws_ec2.InstanceType.of(
    //     cdk.aws_ec2.InstanceClass.T2,
    //     cdk.aws_ec2.InstanceSize.MICRO,
    //   ),
    //   machineImage: new cdk.aws_ec2.AmazonLinuxImage({
    //     generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    //   })
    // });

    // 👇 create RDS instance
    const dbInstance = new cdk.aws_rds.DatabaseInstance(this, 'db-instance', {
      vpc,
      vpcSubnets: {
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
      },
      engine: cdk.aws_rds.DatabaseInstanceEngine.mysql({
        version: cdk.aws_rds.MysqlEngineVersion.VER_8_0_26
      }),
      securityGroups: [ec2InstanceSG],
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.T2,
        cdk.aws_ec2.InstanceSize.MICRO,
      ),
      credentials: cdk.aws_rds.Credentials.fromUsername(
        'mysqladmin',
        {
          password: cdk.SecretValue.plainText('super-secret-01')
        }
      ),
      multiAz: false,
      allocatedStorage: 20,
      // maxAllocatedStorage: 20,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      databaseName: 'vibe731scheduling',
      publiclyAccessible: true,
    });

    // dbInstance.connections.allowFrom(ec2Instance, cdk.aws_ec2.Port.tcp(3306));

    new cdk.CfnOutput(this, 'dbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });

    // new cdk.CfnOutput(this, 'secretName', {
    //   value: dbInstance.secret?.secretName!,
    // });
  }
}
