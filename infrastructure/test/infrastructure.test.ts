import * as cdk from 'aws-cdk-lib/core';
import { Template } from 'aws-cdk-lib/assertions';
import { InfrastructureStack } from '../lib/infrastructure-stack';

describe('InfrastructureStack', () => {
  const app = new cdk.App();
  const stack = new InfrastructureStack(app, 'TestStack', {
    stage: 'test',
  });
  const template = Template.fromStack(stack);

  test('DynamoDB table is created with correct partition key', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'exam-items-test',
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
      ],
    });
  });

  test('All five Lambda functions are created with correct runtime', () => {
    template.resourceCountIs('AWS::Lambda::Function', 5);
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'exam-items-test-createExamItem',
      Runtime: 'nodejs22.x',
      Handler: 'index.createItemHandler',
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'exam-items-test-getExamItem',
      Runtime: 'nodejs22.x',
      Handler: 'index.getItemHandler',
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'exam-items-test-updateExamItem',
      Runtime: 'nodejs22.x',
      Handler: 'index.updateItemHandler',
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'exam-items-test-listExamItems',
      Runtime: 'nodejs22.x',
      Handler: 'index.listItemsHandler',
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'exam-items-test-authorizer',
      Runtime: 'nodejs22.x',
      Handler: 'index.handler',
    });
  });

  test('API Gateway is created with correct name', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Exam API test',
    });
  });

  test('API Gateway authorizer is created with correct identity source', () => {
    template.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Name: 'exam-items-test-authorizer',
      IdentitySource: 'method.request.header.x-api-key',
      Type: 'REQUEST',
      AuthorizerResultTtlInSeconds: 0,
    });
  });

  test('DynamoDB table is destroyed on stack deletion in non-prod', () => {
    template.hasResource('AWS::DynamoDB::Table', {
      DeletionPolicy: 'Delete',
    });
  });
});