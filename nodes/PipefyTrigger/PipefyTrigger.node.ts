import type { IHookFunctions, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData, IDataObject } from 'n8n-workflow';
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
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Pipe (Cards)',
						value: 'pipe',
					},
					{
						name: 'Table (Table Records)',
						value: 'table',
					},
				],
				default: 'pipe',
				required: true,
			},
			{
				displayName: 'Pipe ID',
				name: 'pipeId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the Pipe to monitor events on',
				displayOptions: {
					show: {
						resource: ['pipe'],
					},
				},
			},
			{
				displayName: 'Table ID',
				name: 'tableId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the Table to monitor events on',
				displayOptions: {
					show: {
						resource: ['table'],
					},
				},
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Item Created',
						value: 'card.create',
					},
					{
						name: 'Item Moved',
						value: 'card.move',
					},
					{
						name: 'Item Updated',
						value: 'card.update',
					},
					{
						name: 'Item Deleted',
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
				const resource = this.getNodeParameter('resource') as string;

				const query = `mutation n8nCreateWebhook($input: CreateWebhookInput!) { createWebhook(input: $input) { webhook { id } } }`;
				
				const input: any = {
					actions: [event],
					name: 'n8n Integration Webhook',
					url: webhookUrl,
				};

				if (resource === 'pipe') {
					const pipeId = this.getNodeParameter('pipeId') as string;
					input.pipe_id = parseInt(pipeId, 10);
				} else if (resource === 'table') {
					const tableId = this.getNodeParameter('tableId') as string;
					input.table_id = parseInt(tableId, 10);
				}

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
					const query = `mutation n8nDeleteWebhook($input: DeleteWebhookInput!) { deleteWebhook(input: $input) { success } }`;
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

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		return {
			workflowData: [
				this.helpers.returnJsonArray(req.body as IDataObject),
			],
		};
	}
}
