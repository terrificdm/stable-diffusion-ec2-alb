# CDK deploy stable diffusion webui on EC2   

* Automatically install [sd-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) on AWS EC2 instance  
* Expose webui endpoint("AlbDnsName" in cloudformation's Outputs) through ALB  
* You need to [change ssh key-pars](https://github.com/terrificdm/stable-diffusion-ec2/blob/main/lib/stable-diffusion-ec2-stack.ts#L47) with your own before run below instructions  
* Default credential of webui is admin/123456, you can change those [here](https://github.com/terrificdm/stable-diffusion-ec2/blob/main/lib/stable-diffusion-ec2-stack.ts#L50)  
* Default instance type is g4dn.2xlarge  

# Build  
* Make sure you follow the [AWS CDK Prerequisites](https://docs.aws.amazon.com/cdk/latest/guide/work-with.html#work-with-prerequisites) before you build the project.
* Clone this project and change the directory to the root folder of the project, and run below commands:
```bash
$ npm install -g aws-cdk
$ npm install  
$ cdk bootstrap
```

# Deploy  
* Run commands as below:
```bash
$ cdk synth
$ cdk deploy
```

# Clean  
* Remove ec2 role's policy first, then run:
```bash
$ cdk destroy
```

# Notes  
* SD-Webui files are under /home/ubuntu directory  
* You can use "tail -f /home/ubuntu/stablediffusion.log" to get real time logs for webui  
* Although the deployment of cdk is fast, webui still needs more time(around 15 minutes) to spin up. Check "Status" of ec2 target in ALB target group. The "healthy" indicates that everything is ready to use   
* Regarding using sd-webui, read its [official repo](https://github.com/AUTOMATIC1111/stable-diffusion-webui)  
