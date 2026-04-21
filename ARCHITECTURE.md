# Architecture Documentation

## System Overview

This API manages exam items for the College Board platform. It is built on AWS Lambda and API Gateway, with DynamoDB for persistent storage. Each handler is a discrete Lambda function deployed via AWS CDK.

## Infrastructure

- **API Gateway** — REST API with a custom Lambda authorizer that validates requests using an API key stored in AWS Secrets Manager
- **Lambda** — Five Node.js 22.x functions: createItem, getItem, updateItem, listItems, and apiKeyAuthorizer
- **DynamoDB** — Single table `exam-items-{stage}` with item ID as the partition key
- **Secrets Manager** — Stores the API key used by the authorizer
- **CDK** — Infrastructure is defined as code in the `infrastructure/` directory

## Handler Structure

Handlers are separated into their own directories under `src/handlers/`:

- `src/handlers/createItem/` — POST /api/items
- `src/handlers/getItem/` — GET /api/items/:id
- `src/handlers/updateItem/` — PUT /api/items/:id
- `src/handlers/listItems/` — GET /api/items
- `src/handlers/apiKeyAuthorizer/` — API Gateway request authorizer

For local development, a shared storage instance lives in `src/storage/store.ts`. All handlers import from this single instance to adhere to the singleton pattern, preventing multiple isolated in-memory stores from being created. This ensures that items created by one handler are visible to others during local development and testing. In Lambda, each function connects directly to DynamoDB and is stateless by nature.

## Data Model

### DynamoDB Table
The table uses item ID as the partition key. Each update to an item produces a new version with an incremented version number, preserving the full history of the item and supporting parallel variations distributed to different students in the same testing session.

### Version Field

The `version` field in item metadata is typed as a number and increments by 1 on each update. A future improvement could be to support string-based versioning formats like `"2024-v1"` to distinguish versions by year if business requirements call for it.

### Validation

Input validation is handled by Zod schemas defined in `src/types/schemas.ts`. The `ItemSchema` serves as the single source of truth. The `UpdateItemSchema` is derived from it using `.extend().partial()` to make all fields optional for partial updates. TypeScript types are inferred from the schemas using `z.infer` for request validation types. Server-managed fields like `created`, `lastModified`, and `version` are defined separately in `src/types/item.ts` since they are set by the server rather than validated from client input.

## Key Trade-offs

### PUT vs PATCH
`PUT /api/items/:id` is implemented with partial update semantics. Only the fields included in the request body are updated. Strictly speaking this is PATCH behavior. A future improvement would be to either implement true PUT replacement semantics or rename the endpoint to PATCH.

### PutCommand vs UpdateCommand
The `updateItem` implementation uses a read-modify-write pattern:
1. Read the current item from DynamoDB
2. Merge the incoming changes, increment `version`, stamp `lastModified`
3. Write the entire updated item back using `PutCommand`

The trade-off is simplicity over atomicity. If two requests update the same item simultaneously, both read the same version and one will overwrite the other's changes. Using DynamoDB's `UpdateCommand` would handle this atomically at the database level and is the recommended approach for production workloads with concurrent updates.

### Authorizer Caching
The API Gateway authorizer cache TTL is set to 0 to ensure every request is independently authorized. A non-zero TTL would reduce Secrets Manager calls and lower cost, but risks caching a deny response across endpoints during testing and initial setup.

## Scalability & Performance

- **DynamoDB PAY_PER_REQUEST** billing mode scales automatically with traffic without pre-provisioning capacity
- **Lambda** scales horizontally by default. Each request gets its own function instance
- **DynamoDB Scan with FilterExpression** so `listItems` uses `ScanCommand` with a `FilterExpression` for subject and status filtering. DynamoDB applies `Limit` before `FilterExpression`, so a filtered query with `limit=5` scans exactly 5 raw items and then filters, not the other way around. As a result, a page may return fewer items than the requested limit, or even an empty `items` array, while still returning a `cursor` indicating more pages exist. Callers should paginate until no `cursor` is returned to guarantee all matching results are retrieved
- **GSI trade-off** the correct production fix for filtered listing would be to add GSIs on `subject` and `status` and use `QueryCommand` instead of `ScanCommand`. This was intentionally deferred to avoid modifying the provided DynamoDB schema without stakeholder approval. Note that `status` is nested inside `metadata.status`, so it would need to be flattened to a top-level attribute before a GSI could be added. If approved, these GSIs would enable efficient key-condition filtering and eliminate the scan-before-filter limitation described above
- **API Gateway** handles throttling and rate limiting at the edge before requests reach Lambda
- **Authorizer caching** is currently disabled (TTL=0) for reliability during testing. Re-enabling caching in production would reduce Secrets Manager calls and improve latency

## Local Development

```bash
pnpm install
pnpm dev
```

The local server runs on port 3000 and uses in-memory storage. The API is already deployed to a dev environment. Set `USE_DYNAMODB=true` and `DYNAMODB_TABLE_NAME=exam-items-dev` in a `.env` file at the project root only if you want to connect to the deployed DynamoDB table when running locally. Remove or comment out those lines to return to in-memory storage. Restart the server for the change to take effect by pressing Ctrl+C 
and running pnpm dev again.

The deployed API at https://d7inheammf.execute-api.us-east-1.amazonaws.com/prod/ runs independently on AWS and does not require the local server to be running.

## Deployment

The API is already deployed. The base URL is: https://d7inheammf.execute-api.us-east-1.amazonaws.com/prod/

To deploy your own instance:

1. Configure AWS credentials by either exporting them in your terminal:

```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_DEFAULT_REGION=us-east-1
```

Or add them to a `.env` file at the project root:

```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_DEFAULT_REGION=us-east-1
```

2. Create the API key secret in Secrets Manager as `exam-items-{stage}-api-key`

3. Deploy the stack:

```bash
   cd infrastructure
   cdk deploy
```

## Testing with Postman

Postman collections are included in the root directory as `Item Challenge - Deployed.postman_collection.json` and `Item Challenge - Local.postman_collection.json`. Import either into Postman to test all endpoints.

All deployed requests require an `x-api-key` header. Paste in the API key provided to you directly to authenticate requests.
