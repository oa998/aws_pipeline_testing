import * as cdk from 'aws-cdk-lib';

export class IamStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const adminGroup = new cdk.aws_iam.Group(this, 'admin_and_aws_console', {
      managedPolicies: [
        { managedPolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess' },
      ]
    });

    adminGroup.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: [
          "sts:AssumeRole"
        ],
        resources: ['arn:aws:iam::026406728043:role/eks-stackabc-ClusterRoleFA261979-C2RPM4014MH'], // todo: only the roles that are reasonable
        effect: cdk.aws_iam.Effect.ALLOW
      })
    );

    adminGroup.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: [
          'eks:*'
        ],
        resources: ['*'],
        effect: cdk.aws_iam.Effect.ALLOW
      })
    )
    
    adminGroup.addUser(
      cdk.aws_iam.User.fromUserName(
        this, 'zach.shoults:admin_and_aws_console', 'zach.shoults'
      )
    );
  }
}
