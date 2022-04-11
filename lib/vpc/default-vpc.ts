import * as cdk from 'aws-cdk-lib';

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
