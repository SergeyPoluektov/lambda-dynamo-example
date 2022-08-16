import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import AWSXRay from 'aws-xray-sdk-core';

const rawDbClient = new DynamoDBClient({});
const docDbClient = DynamoDBDocumentClient.from(rawDbClient);
const dbClient = AWSXRay.captureAWSv3Client(docDbClient);

export const handler = async (event: any) => {
  const tableName = process.env.TABLE_NAME || '';

  if (!tableName) {
    throw new Error('Provide TABLE_NAME env variable');
  }

  const testItem = {
    id: `test-id-${Date.now()}`,
    message: 'test message',
  }

  const putCommand = new PutCommand({
    TableName: tableName,
    Item: testItem,
    ReturnConsumedCapacity: 'TOTAL',
  });
  const result = await dbClient.send(putCommand);
  console.log('PUT cmd result', result);

  return 'OK';
}
