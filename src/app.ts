#!/usr/bin/env ts-node
/* eslint-disable-next-line */
import 'source-map-support/register.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const currentDirname = path.dirname(fileURLToPath(import.meta.url));
const srcDirPath = path.resolve(currentDirname, './');

class XrayExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const docsTable = new dynamodb.Table(this, 'docsTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const createDocLambda = new NodejsFunction(
      this,
      'createDocLambda',
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        environment: {
          NODE_OPTIONS: '--enable-source-maps',
          TABLE_NAME: docsTable.tableName,
        },
        entry: path.resolve(srcDirPath, 'lambda.ts'),
        handler: 'handler',
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: false,
          sourceMap: true,
          target: 'node16',
          mainFields: ['module', 'main'],
        },
      }
    );

    docsTable.grantWriteData(createDocLambda);

    // see https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html for more details
    const xrayDaemonWritePolicy = iam.ManagedPolicy.fromAwsManagedPolicyName(
      'AWSXRayDaemonWriteAccess'
    );
    createDocLambda.role?.addManagedPolicy(xrayDaemonWritePolicy);
  }
}

const app = new cdk.App();

const exampleStack = new XrayExampleStack(app, 'xray-example');
