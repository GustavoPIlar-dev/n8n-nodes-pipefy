import type { IHookFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { pipefyApiRequest } from '../Pipefy/GenericFunctions';

export class PipefyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pipefy Trigger',
		name: 'pipefyTrigger',
		icon: { light: 'file:pipefy.svg', dark: 'file:pipefy.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when Pipefy events occur',
		defaults: {
			name: 'Pipefy Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'pipefyOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
			{
				name: 'pipefyApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['personalToken'],
					},
				},
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'Personal Access Token',
						value: 'personalToken',
					},
					{
						name: 'OAuth2 (Service Account)',
						value: 'oAuth2',
					},
				],
				default: 'personalToken',
			},
			{
				displayName: 'Pipe ID',
				name: 'pipeId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the Pipe to monitor events on',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Card Created',
						value: 'card.create',
					},
					{
						name: 'Card Moved',
						value: 'card.move',
					},
					{
						name: 'Card Updated',
						value: 'card.update',
					},
					{
						name: 'Card Deleted',
						value: 'card.delete',
					},
				],
				default: 'card.create',
				required: true,
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					return true;
				}
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const pipeId = this.getNodeParameter('pipeId') as string;

				const query = `mutation($input: WebhookInput!) { createWebhook(input: $input) { webhook { id } } }`;
				const input = {
					actions: [event],
					name: 'n8n Integration Webhook',
					pipe_id: parseInt(pipeId, 10),
					url: webhookUrl,
				};

				const responseData = await pipefyApiRequest.call(this, query, { input });

				if (responseData.createWebhook === undefined) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = responseData.createWebhook.webhook.id as string;

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (webhookData.webhookId !== undefined) {
					const query = `mutation($input: DeleteWebhookInput!) { deleteWebhook(input: $input) { success } }`;
					try {
						await pipefyApiRequest.call(this, query, { input: { id: webhookData.webhookId } });
					} catch (error) {
						return false;
					}
					delete webhookData.webhookId;
				}
				return true;
			},
		},
	};
}
