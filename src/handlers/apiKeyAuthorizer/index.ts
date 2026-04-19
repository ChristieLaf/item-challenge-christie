import {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
} from "aws-lambda";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { logInfo, logError } from "../../logger/logger";

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const apiKey = event.headers?.["x-api-key"];

    if (!apiKey) {
      throw new Error("Unauthorized");
    }

    const secret = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.API_KEY_SECRET_NAME,
      }),
    );

    const validApiKey = secret.SecretString;

    if (apiKey !== validApiKey) {
      throw new Error("Unauthorized");
    }

    logInfo("apiKeyAuthorizer", "Request authorized successfully");

    return generatePolicy("user", "Allow", event.methodArn);
  } catch (error) {
    logError("apiKeyAuthorizer", error);
    throw new Error("Unauthorized");
  }
};

const generatePolicy = (
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string,
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});
