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

    const createExamItemLambda = new nodejs.NodejsFunction(
      this,
      "CreateExamItemFunction",
      {
        functionName: `todo-app-${stage}-createExamItem`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/handlers/createItem/index.ts"),
        handler: "createItemHandler",
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(30),
        bundling: bundlingOptions,
      },
    );

    examItemsTable.grantReadWriteData(createExamItemLambda);

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

    itemsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createExamItemLambda),
    );
  }
}
