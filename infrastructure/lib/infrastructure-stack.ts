import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as path from "path";

export interface InfrastructureStackProps extends cdk.StackProps {
  stage: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // DynamoDB Table
    const examItemsTable = new dynamodb.Table(this, "ExamItemsTable", {
      tableName: `exam-items-${stage}`,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy:
        stage === "prod" ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const lambdaEnvironment = {
      DYNAMODB_TABLE_NAME: examItemsTable.tableName,
      STAGE: stage,
      USE_DYNAMODB: "true",
    };

    const bundlingOptions: nodejs.BundlingOptions = {
      minify: true,
      sourceMap: false,
      target: "es2020",
      format: nodejs.OutputFormat.CJS,
      mainFields: ["main", "module"],
      externalModules: ["aws-sdk"],
    };

    // Lambda Functions
    const createExamItemLambda = new nodejs.NodejsFunction(
      this,
      "CreateExamItemFunction",
      {
        functionName: `exam-items-${stage}-createExamItem`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/handlers/createItem/index.ts"),
        handler: "createItemHandler",
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(30),
        bundling: bundlingOptions,
      },
    );

    const getExamItemLambda = new nodejs.NodejsFunction(
      this,
      "GetExamItemFunction",
      {
        functionName: `exam-items-${stage}-getExamItem`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/handlers/getItem/index.ts"),
        handler: "getItemHandler",
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(30),
        bundling: bundlingOptions,
      },
    );

    const updateExamItemLambda = new nodejs.NodejsFunction(
      this,
      "UpdateExamItemFunction",
      {
        functionName: `exam-items-${stage}-updateExamItem`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/handlers/updateItem/index.ts"),
        handler: "updateItemHandler",
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(30),
        bundling: bundlingOptions,
      },
    );

    const listExamItemsLambda = new nodejs.NodejsFunction(
      this,
      "ListExamItemsFunction",
      {
        functionName: `exam-items-${stage}-listExamItems`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/handlers/listItems/index.ts"),
        handler: "listItemsHandler",
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(30),
        bundling: bundlingOptions,
      },
    );

    // IAM Permissions
    examItemsTable.grantReadWriteData(createExamItemLambda);
    examItemsTable.grantReadData(getExamItemLambda);
    examItemsTable.grantReadWriteData(updateExamItemLambda);
    examItemsTable.grantReadData(listExamItemsLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "ExamAPI", {
      restApiName: `Exam API ${stage}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
      },
    });

    const apiResource = api.root.addResource("api");
    const itemsResource = apiResource.addResource("items");
    const itemResource = itemsResource.addResource("{id}");

    itemsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createExamItemLambda),
    );

    itemsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(listExamItemsLambda),
    );

    itemResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getExamItemLambda),
    );

    itemResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateExamItemLambda),
    );
  }
}
