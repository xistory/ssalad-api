import * as uuid from "uuid";
import handler from "./libs/handler-lib";
import dynamoDb from "./libs/dynamodb-lib";

export const main = handler(async (event, context) => {
    const data = JSON.parse(event.body);
    const params = {
        TableName: process.env.tableName,
        Item: {
            // The attributes of the item to be created
            userId: event.requestContext.identity.cognitoIdentityId, // The id of the author
        },
    };

    if (data.init) {
        params.Item.pointId = "balance";
        params.Item.cash = 0;
        params.Item.point = 0;
        params.Item.accumPoint = 0;
        params.Item.createdAt = Date.now();
    }
    else {
        params.Item.pointId = uuid.v1();
        params.Item.plus = data.plus;
        params.Item.cashAmount = data.cashAmount;
        params.Item.pAmount = data.pAmount;
        params.Item.createdAt = Date.now();

        await dynamoDb.put(params);

        // Get current balance
        const getParams = {
            TableName: process.env.tableName,
            // 'Key' defines the partition key and sort key of the item to be retrieved
            Key: {
                userId: event.requestContext.identity.cognitoIdentityId, // The id of the author
                pointId: "balance", // The id of the note from the path
            },
        };
        const response = await dynamoDb.get(getParams);
        if (!response.Item) {
            throw new Error("Item not found.");
        }

        // Update current balance
        const currCash = data.plus ? response.Item.cash + data.cashAmount : response.Item.cash - data.cashAmount;
        const currPoint = data.plus ? response.Item.point + data.pAmount : response.Item.point - data.pAmount;
        const currAccumPoint = data.plus ? response.Item.accumPoint + data.pAmount : response.Item.accumPoint;

        const upParams = {
            TableName: process.env.tableName,
            // 'Key' defines the partition key and sort key of the item to be updated
            Key: {
                userId: event.requestContext.identity.cognitoIdentityId, // The id of the author
                pointId: "balance", // The id of the note from the path
            },
            // 'UpdateExpression' defines the attributes to be updated
            // 'ExpressionAttributeValues' defines the value in the update expression
            UpdateExpression: "SET cash = :cash, point = :point, accumPoint = :accumPoint",
            ExpressionAttributeValues: {
                ":cash": currCash,
                ":point": currPoint,
                ":accumPoint": currAccumPoint,
            },
            // 'ReturnValues' specifies if and how to return the item's attributes,
            // where ALL_NEW returns all attributes of the item after the update; you
            // can inspect 'result' below to see how it works with different settings
            ReturnValues: "ALL_NEW",
        };

        await dynamoDb.update(upParams);
    }


    return params.Item;
});
