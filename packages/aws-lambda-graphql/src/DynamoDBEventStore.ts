import { DynamoDB } from 'aws-sdk';
import { ulid } from 'ulid';
import { IEventStore, ISubscriptionEvent } from './types';
import { computeTTL } from './helpers';

const DEFAULT_TTL = 7200;
const defaultDynamoDBDocumentClient = new DynamoDB.DocumentClient();

interface DynamoDBEventStoreOptions {
  /**
   * Use this to override default document client (for example if you want to use local dynamodb)
   */
  dynamoDbClient?: DynamoDB.DocumentClient;
  /**
   * Events table name (default is Events)
   */
  eventsTable?: string;
  /**
   * Optional TTL for events (stored in ttl field) in seconds
   *
   * Default value is 2 hours
   */
  ttl?: number;
}

/**
 * DynamoDB event store
 *
 * This event store stores published events in DynamoDB table
 *
 * The server needs to expose DynamoDBEventProcessor handler in order to process these events
 */
export class DynamoDBEventStore implements IEventStore {
  private db: DynamoDB.DocumentClient;

  private tableName: string;

  private ttl: number;

  constructor({
    dynamoDbClient = defaultDynamoDBDocumentClient,
    eventsTable = 'Events',
    ttl = DEFAULT_TTL,
  }: DynamoDBEventStoreOptions = {}) {
    this.db = dynamoDbClient;
    this.tableName = eventsTable;
    this.ttl = ttl;
  }

  publish = async (event: ISubscriptionEvent): Promise<void> => {
    await this.db
      .put({
        TableName: this.tableName,
        Item: {
          id: ulid(),
          ...event,
          ttl: computeTTL(this.ttl),
        },
      })
      .promise();
  };
}
