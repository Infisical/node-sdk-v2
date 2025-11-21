import { InfisicalSDK } from "../src";

const sdk = new InfisicalSDK();

(async function () {
  try {
    const client = sdk.auth().accessToken(process.env.TOKEN!);

    const secrets = await client.secrets().listSecrets({
      projectId: process.env.PROJECT_ID!,
      environment: "dev",
    });

    console.log(secrets);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
