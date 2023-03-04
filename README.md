# CDK for deploying stable diffusion webui on EC2 instance  

* Automatically install [sd-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) on AWS EC2 g4dn instance  
* Expose access-endpoint(check "AlbDnsName" in cloudformation's Outputs) through ALB which is in front of EC2
* Default credential is admin/123456
* Default instance type is g4dn.2xlarge



