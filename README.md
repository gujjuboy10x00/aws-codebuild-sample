# AWS CodeBuild & CodePipeline Sample Application

A simple Node.js application for testing and learning AWS CodeBuild and CodePipeline CI/CD workflows.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run the application
npm start

# Run tests
npm test

# Run linter
npm run lint
```

The server will start on `http://localhost:3000`

### Available Endpoints

- `GET /` - Application info
- `GET /health` - Health check
- `GET /api/hello` - Sample API endpoint
- `POST /api/echo` - Echo endpoint

## 🏗️ AWS Setup Instructions

### Prerequisites

**⚠️ IMPORTANT: Rotate your AWS credentials immediately if you shared them!**

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. Git repository (GitHub, CodeCommit, Bitbucket)

### Step 1: Set Up Source Control

#### Option A: GitHub (Recommended)
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: AWS CodeBuild sample app"

# Create GitHub repository and push
gh repo create aws-codebuild-sample --public --source=. --remote=origin --push
```

#### Option B: AWS CodeCommit
```bash
# Create CodeCommit repository
aws codecommit create-repository --repository-name aws-codebuild-sample

# Add remote and push
git init
git add .
git commit -m "Initial commit"
git remote add origin <codecommit-url>
git push -u origin main
```

### Step 2: Create S3 Bucket for Artifacts

```bash
# Create S3 bucket (use a unique name)
aws s3 mb s3://your-codebuild-artifacts-bucket-name --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket your-codebuild-artifacts-bucket-name \
  --versioning-configuration Status=Enabled
```

### Step 3: Create IAM Service Role for CodeBuild

Create a file `codebuild-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "codebuild.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

```bash
# Create IAM role
aws iam create-role \
  --role-name CodeBuildServiceRole \
  --assume-role-policy-document file://codebuild-trust-policy.json

# Attach managed policies
aws iam attach-role-policy \
  --role-name CodeBuildServiceRole \
  --policy-arn arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess

aws iam attach-role-policy \
  --role-name CodeBuildServiceRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess

# Create inline policy for S3 access
aws iam put-role-policy \
  --role-name CodeBuildServiceRole \
  --policy-name S3ArtifactsAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:GetObjectVersion"],
      "Resource": "arn:aws:s3:::your-codebuild-artifacts-bucket-name/*"
    }]
  }'
```

### Step 4: Create CodeBuild Project

```bash
# Create CodeBuild project
aws codebuild create-project \
  --name aws-codebuild-sample \
  --source type=GITHUB,location=https://github.com/YOUR_USERNAME/aws-codebuild-sample.git \
  --artifacts type=S3,location=your-codebuild-artifacts-bucket-name \
  --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL \
  --service-role arn:aws:iam::YOUR_ACCOUNT_ID:role/CodeBuildServiceRole \
  --region us-east-1
```

**For GitHub:** You'll need to authorize CodeBuild to access your repository through the AWS Console.

### Step 5: Test CodeBuild

```bash
# Start a build manually
aws codebuild start-build --project-name aws-codebuild-sample

# Check build status
aws codebuild list-builds-for-project --project-name aws-codebuild-sample
```

### Step 6: Create CodePipeline for Full CI/CD

#### Create IAM Role for CodePipeline

Create `codepipeline-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "codepipeline.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
```

```bash
# Create role
aws iam create-role \
  --role-name CodePipelineServiceRole \
  --assume-role-policy-document file://codepipeline-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name CodePipelineServiceRole \
  --policy-arn arn:aws:iam::aws:policy/AWSCodePipelineFullAccess
```

#### Create Pipeline Configuration

Create `pipeline-config.json`:
```json
{
  "pipeline": {
    "name": "aws-codebuild-sample-pipeline",
    "roleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/CodePipelineServiceRole",
    "artifactStore": {
      "type": "S3",
      "location": "your-codebuild-artifacts-bucket-name"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [{
          "name": "SourceAction",
          "actionTypeId": {
            "category": "Source",
            "owner": "ThirdParty",
            "provider": "GitHub",
            "version": "1"
          },
          "configuration": {
            "Owner": "YOUR_GITHUB_USERNAME",
            "Repo": "aws-codebuild-sample",
            "Branch": "main",
            "OAuthToken": "YOUR_GITHUB_TOKEN"
          },
          "outputArtifacts": [{"name": "SourceOutput"}]
        }]
      },
      {
        "name": "Build",
        "actions": [{
          "name": "BuildAction",
          "actionTypeId": {
            "category": "Build",
            "owner": "AWS",
            "provider": "CodeBuild",
            "version": "1"
          },
          "configuration": {
            "ProjectName": "aws-codebuild-sample"
          },
          "inputArtifacts": [{"name": "SourceOutput"}],
          "outputArtifacts": [{"name": "BuildOutput"}]
        }]
      }
    ]
  }
}
```

```bash
# Create pipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline-config.json
```

## 🔄 Testing the Pipeline

### Trigger Pipeline Manually
```bash
# Start pipeline execution
aws codepipeline start-pipeline-execution --name aws-codebuild-sample-pipeline

# Check pipeline status
aws codepipeline get-pipeline-state --name aws-codebuild-sample-pipeline
```

### Trigger Pipeline with Code Changes
```bash
# Make a change to the app
echo "// Updated at $(date)" >> src/app.js

# Commit and push
git add .
git commit -m "Test pipeline trigger"
git push origin main
```

The pipeline will automatically trigger on push!

## 🧪 Experiments to Try

1. **Modify the application**: Change the message in `src/app.js` and push to see the pipeline run
2. **Add a failing test**: Intentionally break a test to see the build fail
3. **Modify buildspec.yml**: Add custom build commands or environment variables
4. **Add deployment stage**: Extend the pipeline with a deployment to ECS, Lambda, or EC2

## 🔒 Container Security Testing

If you're testing container escape scenarios for security research:

1. **Privileged Mode**: Enable privileged mode in CodeBuild (NOT recommended for production)
2. **Environment Variables**: Test how secrets are handled
3. **IAM Roles**: Experiment with least-privilege permissions
4. **VPC Configuration**: Test network isolation

**⚠️ Only perform security testing in authorized environments with proper approvals!**

## 📊 Monitoring

- **CloudWatch Logs**: View build logs in CloudWatch
- **CodeBuild Console**: Monitor build history and metrics
- **CodePipeline Console**: Visualize the entire CI/CD flow

## 🛠️ Troubleshooting

### Build Fails
- Check CloudWatch Logs for detailed error messages
- Verify IAM permissions
- Ensure buildspec.yml syntax is correct

### Pipeline Doesn't Trigger
- Verify webhook configuration for GitHub
- Check source connection status
- Ensure branch name matches

### Permission Errors
- Verify IAM roles have necessary permissions
- Check S3 bucket policies
- Review service role trust policies

## 📚 Additional Resources

- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [buildspec.yml Reference](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)

## 🔐 Security Best Practices

1. **Never commit credentials** to source control
2. **Use AWS Secrets Manager** or Parameter Store for sensitive data
3. **Implement least-privilege IAM roles**
4. **Enable CloudTrail** for audit logging
5. **Use VPC** for build environments when handling sensitive data
6. **Rotate credentials** regularly
