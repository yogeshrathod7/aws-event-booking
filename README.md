# AWS Event Booking System

## 📌 Overview
This project implements a **secure, production-grade Event Booking Application** on AWS with automated CI/CD, monitoring, and serverless event processing.

## 🚀 Architecture
- **Frontend**: React app hosted on ECS Fargate + served via CloudFront (HTTPS).
- **Backend**: Node.js REST API on ECS Fargate (behind ALB).
- **Database**: Amazon RDS (MySQL) with credentials stored in AWS Secrets Manager.
- **Serverless Event Processing**: Lambda function triggered by EventBridge for booking confirmations.
- **CI/CD**: GitHub → CodePipeline → CodeBuild → ECR → ECS Blue/Green Deployment + Lambda updates.
- **Monitoring & Logging**: CloudWatch logs & alarms for ECS, Lambda, and ALB.

## 🛠️ Services Used
- **ECS (Fargate)**
- **ALB + CloudFront**
- **RDS (MySQL)**
- **Secrets Manager**
- **EventBridge + Lambda**
- **ECR, CodePipeline, CodeBuild, CodeDeploy**
- **CloudWatch**

## 🔐 Security
- IAM least-privilege roles
- RDS security groups restricted to ECS tasks only
- SSL termination with ACM

## ✅ Validation Flow
1. Open CloudFront URL → Load frontend.
2. View events (`/events` API → ECS → RDS).
3. Book an event (`/book` API → ECS → RDS).
4. EventBridge triggers Lambda → Booking confirmation logged in CloudWatch.
5. Push a new commit → CodePipeline rebuilds & deploys ECS + Lambda.

---
