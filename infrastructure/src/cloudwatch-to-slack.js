/* eslint-disable @typescript-eslint/no-var-requires */
const { handler } = require('lambda-cloudwatch-slack');

console.log(JSON.stringify(process.env, null, 2));

module.exports = { handler };
