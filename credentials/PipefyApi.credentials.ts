import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PipefyApi implements ICredentialType {
	name = 'pipefyApi';
	displayName = 'Pipefy API';
	
	documentationUrl = 'https://developers.pipefy.com/reference/graphql-endpoint';

	properties: INodeProperties[] = [
		{
			displayName: 'Personal Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'The personal access token from Pipefy',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.pipefy.com',
			url: '/graphql',
			method: 'POST',
			body: {
				query: '{ me { id } }',
			},
		},
	};
}
