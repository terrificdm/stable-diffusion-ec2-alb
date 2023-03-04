import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'

export class StableDiffusionEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {isDefault: true});
    
    const ubuntuLinux = ec2.MachineImage.genericLinux({
      'us-east-1': 'ami-0557a15b87f6559cf',
    });
    
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
      'git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui /home/ubuntu/stable-diffusion-webui',
      'wget https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned.safetensors -P /home/ubuntu/stable-diffusion-webui/models/Stable-diffusion/',
      'chown ubuntu /home/ubuntu/stable-diffusion-webui -R',
      `su ubuntu -c 'nohup bash /home/ubuntu/stable-diffusion-webui/webui.sh --xformers --listen  --gradio-auth admin:123456 > /home/ubuntu/stablediffusion.log 2>&1 &'`
      ); // Change username & password to yours through -gradio-auth admin:123456
    
    const instance = new ec2.Instance(this, 'Instance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.G4DN, ec2.InstanceSize.XLARGE2),
      machineImage: ubuntuLinux,
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(500)
      }],
      userData: userData,
      keyName: 'demo' //You need to replace the value of keyName with your own key-pairs name!
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
      description: 'The AWS console for specific EC2 instance'
    });
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Access Stable-Diffusion-WebUi Portal, admin/123456'
    });
  }
}
