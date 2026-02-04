# Quick Setup Guide

## 🚨 SECURITY FIRST

**Before anything else, if you shared AWS credentials:**
1. Go to AWS IAM Console
2. Delete or rotate the exposed access keys immediately
3. Review CloudTrail logs for any unauthorized access

## 🎯 Quick Setup Options

### Option 1: CloudFormation (Fastest)

This creates everything automatically:

```bash
# Deploy the entire stack
aws cloudformation create-stack \
  --stack-name codebuild-sample \
  --template-body file://cloudformation-template.yml \
  --parameters \
    ParameterKey=GitHubRepo,ParameterValue=YOUR_USERNAME/aws-codebuild-sample \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=GitHubToken,ParameterValue=YOUR_GITHUB_TOKEN \
  --capabilities CAPABILITY_NAMED_IAM

# Check stack status
aws cloudformation describe-stacks --stack-name codebuild-sample

# Get outputs (Pipeline URL, etc.)
aws cloudformation describe-stacks --stack-name codebuild-sample --query 'Stacks[0].Outputs'
```

### Option 2: AWS Console (Visual)

1. **Commit code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create aws-codebuild-sample --public --source=. --push
   ```

2. **Create CodeBuild Project** (AWS Console):
   - Navigate to CodeBuild → Create project
   - Source: GitHub (connect your account)
   - Environment: `aws/codebuild/standard:7.0`
   - Buildspec: Use `buildspec.yml` from repository
   - Artifacts: S3 bucket (create new)

3. **Create CodePipeline** (AWS Console):
   - Navigate to CodePipeline → Create pipeline
   - Source: GitHub (select your repo)
   - Build: CodeBuild (select project from step 2)
   - Deploy: Skip for now

### Option 3: AWS CLI (Manual Control)

Follow the detailed steps in `README.md`

## 🧪 Testing the Setup

### 1. Verify Local Build
```bash
npm install
npm test
```

### 2. Trigger Manual Build
```bash
# Via CLI
aws codebuild start-build --project-name aws-codebuild-sample

# Via Console
# Go to CodeBuild → Projects → Select project → Start build
```

### 3. Trigger Pipeline with Code Change
```bash
# Edit the app
echo "console.log('Pipeline test');" >> src/app.js

# Push changes
git add .
git commit -m "Test pipeline automation"
git push origin main

# Watch it run!
aws codepipeline get-pipeline-state --name aws-codebuild-sample-pipeline
```

## 🔍 Monitoring Your Pipeline

### CloudWatch Logs
```bash
# View logs
aws logs tail /aws/codebuild/aws-codebuild-sample --follow

# Or in Console:
# CloudWatch → Logs → /aws/codebuild/aws-codebuild-sample
```

### Pipeline Status
```bash
# Check pipeline status
aws codepipeline get-pipeline-state --name aws-codebuild-sample-pipeline

# List recent executions
aws codepipeline list-pipeline-executions --pipeline-name aws-codebuild-sample-pipeline
```

## 🐛 Quick Troubleshooting

### Build Fails
```bash
# Get build details
BUILD_ID=$(aws codebuild list-builds --max-items 1 --query 'ids[0]' --output text)
aws codebuild batch-get-builds --ids $BUILD_ID

# Check logs
aws logs get-log-events --log-group-name /aws/codebuild/aws-codebuild-sample --log-stream-name <stream-name>
```

### Permission Errors
- Check IAM role has CodeBuild permissions
- Verify S3 bucket policy allows CodeBuild access
- Ensure GitHub token has repo access

### Pipeline Not Triggering
- Verify webhook exists in GitHub repo settings
- Check source connection in CodePipeline
- Ensure branch name matches

## 🔒 Container Security Testing

**Important: Only perform these tests in authorized environments!**

### Enable Privileged Mode (for testing)
```yaml
# In buildspec.yml, you can test Docker-in-Docker
phases:
  install:
    commands:
      - echo "Testing privileged operations..."
      - docker ps  # Will fail without privileged mode
```

Update CodeBuild project:
```bash
aws codebuild update-project \
  --name aws-codebuild-sample \
  --environment type=LINUX_CONTAINER,privilegedMode=true,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL
```

### Test Environment Inspection
Add to buildspec.yml:
```yaml
pre_build:
  commands:
    - whoami
    - env | sort
    - cat /proc/self/cgroup
    - df -h
    - mount | grep -i container
```

### Test IAM Role Access
```yaml
pre_build:
  commands:
    - aws sts get-caller-identity
    - aws s3 ls
```

## 🎓 Learning Exercises

1. **Break the build**: Add a failing test and watch it fail
2. **Add stages**: Add a manual approval step in CodePipeline
3. **Deploy somewhere**: Add Lambda or ECS deployment stage
4. **Secrets handling**: Add secrets from Secrets Manager
5. **Parallel builds**: Create multiple CodeBuild projects

## 🧹 Cleanup

### Delete Everything
```bash
# If using CloudFormation
aws cloudformation delete-stack --stack-name codebuild-sample

# Manual cleanup
aws codepipeline delete-pipeline --name aws-codebuild-sample-pipeline
aws codebuild delete-project --name aws-codebuild-sample
aws s3 rb s3://your-bucket-name --force
aws iam delete-role --role-name CodeBuildServiceRole
aws iam delete-role --role-name CodePipelineServiceRole
```

## 📚 Next Steps

- Add deployment stages (ECS, Lambda, EC2)
- Implement blue/green deployments
- Add security scanning (SAST/DAST)
- Set up notifications (SNS, Slack)
- Create multi-region pipelines
- Implement testing strategies (unit, integration, e2e)
