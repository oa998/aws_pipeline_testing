import { handler } from "../lib/lambda/hello-world";

//https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html
test('should fail', async () => {
  const result = await handler("", "");
  expect(result.statusCode).toEqual(200);
});
