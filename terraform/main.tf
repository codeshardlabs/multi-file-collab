provider "aws" {
  region = var.region
}


### Provision VPC
resource "aws_vpc" "tf-vpc" {
  cidr_block = var.vpc_cidr_block

  tags = {
    Name = "main_vpc"
  }
}

resource "aws_subnet" "tf-subnet" {
  vpc_id = aws_vpc.tf-vpc.id
  cidr_block = var.vpc_cidr_block
  availability_zone = var.availability_zone
  tags = {
    Name = "tf-subnet"
  }
}

## Security Groups 

resource "aws_security_group" "alb_sg" {
  name        = "alb_sg"
  description = "AWS ALB Security Group"
  vpc_id      = aws_vpc.tf-vpc.id

  // Inbound Rules
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  //Outbound Rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2_sg"
  description = "EC2 Security Group"
  vpc_id      = aws_vpc.tf-vpc.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] ## allow HTTP traffic from Load Balancer
  }

  //Outbound Rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_lb" "alb" {
  name               = "alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]

}


### Instance Target Group
resource "aws_lb_target_group" "alb_tg" {
  name     = "alb-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.tf-vpc.id

  health_check {
    protocol = "HTTP"
    port     = 3000
    path     = "/health"
    matcher  = "200"
    interval = 300
  }
}


## ALB Listener 
resource "aws_lb_listener" "name" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  ## Forward Action
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_tg.arn
  }
}


resource "aws_launch_template" "ec2_template" {
  name          = "ec2_template"
  description   = "EC2 launch template for Auto Scaling Group"
  image_id      = var.ami_id
  instance_type = var.instance_type

  ## configure with ec2 security groups
  network_interfaces {
    security_groups             = [aws_security_group.ec2_sg.id]
    associate_public_ip_address = true
  }

  user_data = file("main.sh")
  

}


resource "aws_autoscaling_group" "asg" {
  name     = "asg"
  min_size = 1
  max_size = 3
  desired_capacity = 2
  vpc_zone_identifier = [aws_subnet.tf-subnet.id]
 
  target_group_arns = [aws_lb_target_group.alb_tg.arn]

  launch_template {
    id      = aws_launch_template.ec2_template.id
    version = "$Latest"
  }

  health_check_type         = "EC2"
  health_check_grace_period = 300

  tag {
    key                 = "ASG"
    value               = "example-asg-instance"
    propagate_at_launch = true
  }
}


## Creating Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up-policy"
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.asg.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "scale-down-policy"
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.asg.name
}

## CloudWatch alarms for scale up and scale down

resource "aws_cloudwatch_metric_alarm" "scale_up_alarm" {
  alarm_name          = "scale_up_alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  evaluation_periods  = 2
  threshold           = 30 ## if >= 50% CPU utilization, then scale up
  statistic           = "Average"
  period              = 120
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.asg.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "scale_down_alarm" {
  alarm_name = "scale_down_alarm"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  comparison_operator = "LessThanThreshold"
  metric_name = "CPUUtilization"
  evaluation_periods = 2
  period = 120
  statistic = "Average"
  threshold = 10
namespace = "AWS/EC2"
   dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.asg.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_down.arn]
}