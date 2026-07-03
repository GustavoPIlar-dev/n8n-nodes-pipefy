import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class PipefyOAuth2Api implements ICredentialType {
	name = 'pipefyOAuth2Api';
	extends = ['oAuth2Api'];
	displayName = 'Pipefy OAuth2 API';
	documentationUrl = 'https://developers.pipefy.com/reference/graphql-endpoint';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'string',
			default: '',
			required: true,
			description: 'The Token URL provided by your Pipefy Service Account',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
