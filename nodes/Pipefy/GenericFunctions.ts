import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IRequestOptions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function pipefyApiRequest(
	this: IExecuteFunctions | IWebhookFunctions | IHookFunctions | ILoadOptionsFunctions,
	query: string,
	variables: IDataObject = {},
	option: IDataObject = {},
): Promise<any> {
	// Identify which credential is being used
	let credentialType = 'pipefyApi';
	
	try {
		const credentials = await this.getCredentials('pipefyApi').catch(() => undefined);
		if (!credentials) {
			const oauth2Credentials = await this.getCredentials('pipefyOAuth2Api').catch(() => undefined);
			if (oauth2Credentials) {
				credentialType = 'pipefyOAuth2Api';
			}
		}
	} catch (error) {
		// Fallback to default
	}

	const options: IRequestOptions = {
		method: 'POST',
		url: 'https://api.pipefy.com/graphql',
		body: {
			query,
			variables,
		},
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		const response = await this.helpers.requestWithAuthentication.call(this, credentialType, options);

		if (response.errors) {
			throw new NodeApiError(this.getNode(), response, { message: response.errors[0].message });
		}

		return response.data;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function pipefyApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	propertyName: string,
	query: string,
	variables: IDataObject = {},
): Promise<any[]> {
	let returnData: any[] = [];
	let responseData;
	let hasNextPage = true;

	while (hasNextPage) {
		responseData = await pipefyApiRequest.call(this, query, variables);
		
		const data = propertyName.split('.').reduce((o: any, i) => o?.[i], responseData);
		if (!data) {
			break;
		}

		const edges = data.edges || [];
		const nodes = edges.map((edge: any) => edge.node);
		returnData = returnData.concat(nodes);

		if (data.pageInfo && data.pageInfo.hasNextPage) {
			variables.after = data.pageInfo.endCursor;
		} else {
			hasNextPage = false;
		}
	}
	return returnData;
}
