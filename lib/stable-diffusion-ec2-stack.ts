import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'

export class StableDiffusionEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {isDefault: true});
    
    const ubuntuLinux = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id',
      { os: ec2.OperatingSystemType.LINUX }
      );

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'apt-get update -y',
      'apt install gcc -y',
      `distribution=$(. /etc/os-release;echo $ID$VERSION_ID | sed -e 's/\\.//g')`,
      'wget https://developer.download.nvidia.com/compute/cuda/repos/$distribution/x86_64/cuda-keyring_1.0-1_all.deb',
      'dpkg -i cuda-keyring_1.0-1_all.deb',
      'apt-get update -y',
      'apt-get -y install cuda-drivers',
      'apt install wget git python3 python3-venv -y',
      'apt install python3-pip -y',
      'pip install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
      'mkdir -p /opt/aws/bin',
      'ln -s /usr/local/bin/cfn-* /opt/aws/bin/',
      'git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui /home/ubuntu/stable-diffusion-webui',
      'wget https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned.safetensors -P /home/ubuntu/stable-diffusion-webui/models/Stable-diffusion/',
      'chown ubuntu /home/ubuntu/stable-diffusion-webui -R',
      'cd /home/ubuntu/stable-diffusion-webui',
      );
    
    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.G4DN, ec2.InstanceSize.XLARGE2),
      machineImage: ubuntuLinux,
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(500)
      }],
      userData: userData,
      keyName: 'demo', //You need to replace the value of keyName with your own key-pairs name!
      init: ec2.CloudFormationInit.fromElements(
        ec2.InitCommand.shellCommand(`su ubuntu -c 'bash webui.sh --xformers --exit'`),
        ec2.InitCommand.shellCommand(`su ubuntu -c 'nohup bash webui.sh --xformers --listen  --gradio-auth admin:123456 > ./sd-webui.log 2>&1 &'`), // Change username & password to yours through -gradio-auth admin:123456
        ),
        resourceSignalTimeout: cdk.Duration.minutes(20),
    });
    
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(22), 'Allow ssh from internet');
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(443), 'Allow https from internet'); // if you don't want to enable "share" flag for directly public access, comment this line out.
    
    const instanceTarget = new elbv2_targets.InstanceTarget(instance)
    
    const alb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true
    });
    
    const listener =alb.addListener('Listener', {
      port :80
    });
    
    listener.addTargets('sd-tg', {
      port: 7860,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [instanceTarget]
    });
    
    alb.connections.allowTo(instance, ec2.Port.tcp(7860), 'Allow to access sd instance');
    
    new cdk.CfnOutput(this, 'InstanceConsole', {
      value: 'https://console.aws.amazon.com/ec2/home?region='+instance.env.region+'#Instances:search='+instance.instanceId,
      description: 'The AWS console for webui EC2 instance'
    });
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Stable-Diffusion-WebUi Portal, login as admin/123456'
    });
    new cdk.CfnOutput(this, 'AlbConsole', {
      value: 'https://console.aws.amazon.com/ec2/home?region='+alb.env.region+'#LoadBalancers:search='+alb.loadBalancerArn,
      description: 'The AWS console for ALB, use this to quickly jump to check health status of target in ALB target group'
    });
  }
}
