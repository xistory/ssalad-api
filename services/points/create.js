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
        params.Item.createdAt = Date.now();
    }
    else {
        params.Item.pointId = uuid.v1();
        params.Item.plus = data.plus;
        params.Item.cashAmount = data.cashAmount;
        params.Item.pAmount = data.pAmount;
        params.Item.createdAt = Date.now();
    }

    await dynamoDb.put(params);

    return params.Item;
});
