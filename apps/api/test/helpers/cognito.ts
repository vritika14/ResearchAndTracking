import {
  AdminInitiateAuthCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

export async function getTestAccessToken(
  username: string,
  password: string,
): Promise<string> {
  const command = new AdminInitiateAuthCommand({
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });

  const response = await client.send(command);
  const accessToken = response.AuthenticationResult?.AccessToken;

  if (!accessToken) {
    throw new Error(`Failed to obtain access token for ${username}`);
  }

  return accessToken;
}
