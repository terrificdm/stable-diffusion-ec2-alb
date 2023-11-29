# CDK deploy stable diffusion webui on EC2   

* Automatically install [sd-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) on AWS EC2 instance  
* Expose webui endpoint("AlbDnsName" in cloudformation's Outputs) through ALB  
* You need to [change ssh key-pars](https://github.com/terrificdm/stable-diffusion-ec2-alb/blob/main/lib/stable-diffusion-ec2-alb-stack.ts#L46) with your own before run below instructions  
* Default credential of webui is admin/123456, you can change those [here](https://github.com/terrificdm/stable-diffusion-ec2-alb/blob/main/lib/stable-diffusion-ec2-alb-stack.ts#L49)  
* Default instance type is g5.2xlarge  

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
* SD-Webui repo is under /home/ubuntu directory  
* Default command in CDK scripts for running SD-Webui is "nohup bash webui.sh --xformers --listen  --gradio-auth admin:123456 > ./sd-webui.log 2>&1 &", you can kill that process and run your own [command with different flags](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Command-Line-Arguments-and-Settings)
* You can use "tail -f /home/ubuntu/sd-webui.log" to get real time logs for webui  
* After CDK deployment is finished, SD-Webui instance still needs some time to be initiated at ALB backend. Please check "Status" of ec2 target in ALB target group. The "healthy" indicates that everything is ready to use   
* Regarding how to use SD-Webui, read its [official repo](https://github.com/AUTOMATIC1111/stable-diffusion-webui)  
