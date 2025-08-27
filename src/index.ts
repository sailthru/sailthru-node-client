import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as querystring from 'querystring';
import * as needle from 'needle';
import { SailthruUtil, log } from './utils';
import { file as multipartFile } from './multipart';
import { version } from '../package.json';
import type {
  SailthruOptions,
  ApiResponse,
  ApiError,
  ApiCallback,
  RateLimitInfo,
  SendOptions,
  MultiSendOptions,
  SendResponse,
  UserProfile,
  BlastData,
  BlastStatus,
  TemplateData,
  TemplateResponse,
  ContentData,
  PurchaseItem,
  PurchaseData,
  JobData,
  JobStatus,
  StatsData,
  ListData,
  ListResponse,
  AlertData,
  EventData,
  WebhookParams,
} from './types';

export const VERSION = version;

const USER_AGENT = `Sailthru API Node/JavaScript Client ${VERSION}`;

interface JsonPayload {
  api_key: string;
  format: string;
  json: string;
  sig: string;
  [key: string]: any;
}

class SailthruRequest {
  public logging: boolean = true;
  public last_rate_limit_info: Record<string, RateLimitInfo> = {};

  private validMethods = ['GET', 'POST', 'DELETE'];

  log2(message: string): void {
    if (this.logging === true) {
      log(message);
    }
  }

  _http_request(
    uri: string,
    data: Record<string, any>,
    method: string,
    binary_data_params: string[],
    callback: ApiCallback,
    agent?: http.Agent
  ): void {
    const parse_uri = url.parse(uri);
    const options: any = {
      host: parse_uri.hostname,
      port: parse_uri.port || (parse_uri.protocol === 'http:' ? 80 : 443),
      path: parse_uri.pathname,
      method: method,
      query: data,
      headers: {
        'User-Agent': USER_AGENT,
        Host: parse_uri.host,
      },
    };

    if (agent) {
      options.agent = agent;
    }

    const http_protocol = parse_uri.protocol === 'http:' ? http : (options.port === 80 ? http : https);
    const query_string = querystring.stringify(data);

    switch (method) {
      case 'GET':
        options.path += '?' + query_string;
        break;
      case 'DELETE':
        options.path += '?' + query_string;
        options.headers['Content-Length'] = 0;
        break;
      case 'POST':
        options.headers['Content-Length'] = query_string.length;
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        break;
      default:
        return;
    }

    this.log2(method + ' Request');
    
    const req = http_protocol.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      const statusCode = res.statusCode || 0;
      
      this.log2('Status Code: ' + res.statusCode);
      
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const json_response = JSON.parse(body);

          if (res.headers['x-rate-limit-limit'] !== undefined) {
            const rate_limit_headers: RateLimitInfo = {
              limit: Number(res.headers['x-rate-limit-limit']),
              remaining: Number(res.headers['x-rate-limit-remaining']),
              reset: Number(res.headers['x-rate-limit-reset']),
            };
            this.last_rate_limit_info[parse_uri.pathname + '|' + options.method] = rate_limit_headers;
          }

          if (statusCode === 200) {
            return callback(null, json_response);
          } else {
            const json_err: ApiError = {
              statusCode: statusCode,
              error: json_response.error,
              errormsg: json_response.errormsg,
            };
            return callback(json_err, json_response);
          }
        } catch (error) {
          const json_err: ApiError = {
            statusCode: 0,
            error: 0,
            errormsg: error instanceof Error ? error.message : 'Unknown error',
          };
          return callback(json_err);
        }
      });
    });

    req.on('error', (err) => {
      const apiError: ApiError = {
        statusCode: 0,
        error: 0,
        errormsg: err.message || 'Network error'
      };
      return callback(apiError);
    });

    if (method === 'POST') {
      req.write(
        url.format({
          query: options.query,
        }).replace('?', ''),
        'utf8'
      );
    }

    req.end();
  }

  _api_request(
    uri: string,
    data: Record<string, any>,
    request_method: string,
    binary_data_params: string[],
    callback: ApiCallback,
    agent?: http.Agent
  ): void {
    return this._http_request(uri, data, request_method, binary_data_params, callback, agent);
  }
}

export class SailthruClient {
  static logging: boolean = true;

  private api_key: string;
  private api_secret: string;
  private options: SailthruOptions;
  private api_url: string;
  private agent: http.Agent | false;
  private request: SailthruRequest;
  public logging: boolean = true;

  constructor(api_key: string, api_secret: string, options: SailthruOptions = {}) {
    this.api_key = api_key;
    this.api_secret = api_secret;
    this.options = options || {};
    this.api_url = this.options.apiUrl || 'https://api.sailthru.com';
    this.agent = this.options.agent || false;

    const _url = url.parse(this.api_url);
    if (_url.protocol && _url.protocol !== 'http:' && _url.protocol !== 'https:') {
      throw new Error('Must specify protocol of http:// or https://');
    }
    if (_url.port && !_url.protocol) {
      throw new Error('Must specify protocol if overriding port');
    }
    if (!_url.protocol) {
      const protocol = _url.port && _url.port === '80' ? 'http:' : 'https:';
      this.api_url = protocol + '//' + this.api_url;
    }

    if (this.agent && !(this.agent instanceof http.Agent)) {
      throw new Error(
        'If you provide an agent, it must implement http.Agent. ' +
          'Callers may create an agent with the proxy-agent module and pass it as "agent" in the options object'
      );
    }

    this.request = new SailthruRequest();
  }

  log2(message: string): void {
    if (this.logging === true) {
      log(message);
    }
  }

  _json_payload(data: Record<string, any>): JsonPayload {
    const payload: JsonPayload = {
      api_key: this.api_key,
      format: 'json',
      json: JSON.stringify(data),
      sig: '',
    };
    payload.sig = SailthruUtil.getSignatureHash(payload, this.api_secret);
    return payload;
  }

  _apiRequest(action: string, data: Record<string, any>, method: string, callback: ApiCallback): void {
    const _url = url.parse(this.api_url);
    const json_payload = this._json_payload(data);
    return this.request._api_request(_url.href + action, json_payload, method, [], callback, this.agent || undefined);
  }

  enableLogging(): void {
    this.request.logging = true;
    this.logging = true;
  }

  disableLogging(): void {
    this.request.logging = false;
    this.logging = false;
  }

  apiGet(action: string, data: Record<string, any>, callback: ApiCallback): void {
    return this._apiRequest(action, data, 'GET', callback);
  }

  apiPost(action: string, data: Record<string, any>, binary_data_params?: string[] | ApiCallback, callback?: ApiCallback): void {
    if (typeof binary_data_params === 'function') {
      callback = binary_data_params;
      binary_data_params = [];
    }
    binary_data_params = binary_data_params || [];

    if (binary_data_params.length > 0) {
      return this.apiPostMultiPart(action, data, binary_data_params, callback!);
    } else {
      return this._apiRequest(action, data, 'POST', callback!);
    }
  }

  apiPostMultiPart(action: string, data: Record<string, any>, binary_data_params: string[], callback: ApiCallback): void {
    const binary_data: Record<string, any> = {};
    
    for (const param of binary_data_params) {
      binary_data[param] = multipartFile(data[param]);
      delete data[param];
    }

    const _url = url.parse(this.api_url);
    const json_payload = this._json_payload(data);
    const json_payload_to_log = this._json_payload(data);

    for (const param in binary_data) {
      const value = binary_data[param];
      json_payload[param] = value;
      json_payload_to_log[param] = '[TRUNCATED]';
    }

    const options: needle.NeedleOptions = {
      multipart: true,
      user_agent: USER_AGENT,
    };

    if (this.agent) {
      options.agent = this.agent;
    }

    this.log2(_url.href + action);
    this.log2('MultiPart Request');
    this.log2('JSON Payload: ' + JSON.stringify(json_payload_to_log));

    needle.post(_url.href + action, json_payload, options, (_error, _response, result) => {
      return callback(null, result);
    });
    return;
  }

  apiDelete(action: string, data: Record<string, any>, callback: ApiCallback): void {
    return this._apiRequest(action, data, 'DELETE', callback);
  }

  _getOptions(options: any): Record<string, any> {
    return options !== null ? options : {};
  }

  send(template: string, email: string, options?: SendOptions | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};

    const data = this._getOptions(options);
    data.template = template;
    data.email = email;
    return this.apiPost('send', data, callback!);
  }

  multiSend(template: string, emails: string | string[], options?: MultiSendOptions | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};

    const data = this._getOptions(options);
    data.template = template;
    data.email = Array.isArray(emails) ? emails.join(',') : emails;
    return this.apiPost('send', data, callback!);
  }

  getSend(send_id: string, callback: ApiCallback): void {
    return this.apiGet('send', { send_id }, callback);
  }

  cancelSend(sendId: string, callback: ApiCallback): void {
    const data = { send_id: sendId };
    return this.apiDelete('send', data, callback);
  }

  getUserBySid(sid: string, callback: ApiCallback): void {
    const data = { id: sid };
    return this.apiGet('user', data, callback);
  }

  getUserByKey(id: string, key: string, fields?: any, callback?: ApiCallback): void {
    const data: any = { id, key };
    if (typeof fields === 'function') {
      callback = fields as ApiCallback;
    } else if (fields !== undefined) {
      data.fields = fields;
    }
    return this.apiGet('user', data, callback!);
  }

  saveUserBySid(sid: string, options: Record<string, any>, callback: ApiCallback): void {
    const data = { ...options, id: sid };
    return this.apiPost('user', data, callback);
  }

  saveUserByKey(id: string, key: string, options: Record<string, any>, callback: ApiCallback): void {
    const data = { ...options, id, key };
    return this.apiPost('user', data, callback);
  }

  getBlast(blastId: string, callback: ApiCallback): void {
    const data = { blast_id: blastId };
    return this.apiGet('blast', data, callback);
  }

  deleteBlast(blastId: string, callback: ApiCallback): void {
    const data = { blast_id: blastId };
    return this.apiDelete('blast', data, callback);
  }

  unscheduleBlast(blastId: string, callback: ApiCallback): void {
    const data = {
      blast_id: blastId,
      schedule_time: '',
      status: 'draft',
    };
    return this.apiPost('blast', data, callback);
  }

  pauseBlast(blastId: string, callback: ApiCallback): void {
    const data = {
      blast_id: blastId,
      paused: true,
    };
    return this.apiPost('blast', data, callback);
  }

  resumeBlast(blastId: string, callback: ApiCallback): void {
    const data = {
      blast_id: blastId,
      paused: false,
    };
    return this.apiPost('blast', data, callback);
  }

  cancelBlast(blastId: string, callback: ApiCallback): void {
    const data = {
      blast_id: blastId,
      status: 'sent',
    };
    return this.apiPost('blast', data, callback);
  }

  updateBlast(blastId: string, options?: BlastData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = { ...this._getOptions(options), blast_id: blastId };
    return this.apiPost('blast', data, callback!);
  }

  scheduleBlastFromBlast(blastId: string, scheduleTime: string, options?: BlastData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = {
      ...this._getOptions(options),
      blast_id: blastId,
      schedule_time: scheduleTime,
    };
    return this.apiPost('blast', data, callback!);
  }

  scheduleBlastFromTemplate(
    blastId: string,
    template: string,
    list: string,
    scheduleTime: string,
    options?: BlastData | ApiCallback,
    callback?: ApiCallback
  ): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = {
      ...this._getOptions(options),
      blast_id: blastId,
      copy_template: template,
      list,
      schedule_time: scheduleTime,
    };
    return this.apiPost('blast', data, callback!);
  }

  scheduleBlast(
    name: string,
    list: string,
    scheduleTime: string,
    fromName: string,
    fromEmail: string,
    subject: string,
    contentHtml: string,
    contentText: string,
    options?: BlastData | ApiCallback,
    callback?: ApiCallback
  ): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = {
      ...this._getOptions(options),
      name,
      list,
      schedule_time: scheduleTime,
      from_name: fromName,
      from_email: fromEmail,
      subject,
      content_html: contentHtml,
      content_text: contentText,
    };
    return this.apiPost('blast', data, callback!);
  }

  getTemplates(callback: ApiCallback): void {
    return this.apiGet('template', {}, callback);
  }

  getTemplate(template: string, callback: ApiCallback): void {
    const data = { template };
    return this.apiGet('template', data, callback);
  }

  getTemplateFromRevision(revisionId: string, callback: ApiCallback): void {
    const data = { revision: revisionId };
    return this.apiGet('template', data, callback);
  }

  saveTemplate(template: string, options?: TemplateData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = { ...this._getOptions(options), template };
    return this.apiPost('template', data, callback!);
  }

  saveTemplateFromRevision(template: string, revisionId: string, callback: ApiCallback): void {
    const options = { revision: revisionId };
    return this.saveTemplate(template, options, callback);
  }

  deleteTemplate(template: string, callback: ApiCallback): void {
    return this.apiDelete('template', { template }, callback);
  }

  getLists(callback: ApiCallback): void {
    const data = { list: '' };
    return this.apiGet('list', data, callback);
  }

  getList(list: string, options?: Record<string, any> | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data = { ...this._getOptions(options), list };
    return this.apiGet('list', data, callback!);
  }

  saveList(list: string, emails: string[], callback: ApiCallback): void {
    const data = { 
      list,
      emails: Array.isArray(emails) ? emails.join(',') : emails
    };
    return this.apiPost('list', data, callback);
  }

  deleteList(list: string, callback: ApiCallback): void {
    const data = { list };
    return this.apiDelete('list', data, callback);
  }

  getAlert(email: string, callback: ApiCallback): void {
    const data = { email };
    return this.apiGet('alert', data, callback);
  }

  saveAlert(
    email: string, 
    type: string, 
    template: string, 
    when?: string | Record<string, any> | ApiCallback, 
    options?: Record<string, any> | ApiCallback,
    callback?: ApiCallback
  ): void {
    // Handle overloaded parameters
    if (typeof when === 'function') {
      callback = when as ApiCallback;
      when = undefined;
      options = {};
    } else if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }

    const data: any = {
      email,
      type,
      template,
      ...this._getOptions(options || {})
    };

    if (when && typeof when === 'string') {
      data.when = when;
    }

    return this.apiPost('alert', data, callback!);
  }

  deleteAlert(email: string, alert_id: string, callback: ApiCallback): void {
    const data = { email, alert_id };
    return this.apiDelete('alert', data, callback);
  }

  importContacts(
    email: string, 
    password: string, 
    include_name?: boolean | ApiCallback,
    callback?: ApiCallback
  ): void {
    if (typeof include_name === 'function') {
      callback = include_name as ApiCallback;
      include_name = false;
    }
    include_name = include_name || false;

    const data = {
      email,
      password,
      include_name: include_name ? 1 : 0
    };

    return this.apiPost('contacts', data, callback!);
  }

  pushContent(title: string, url: string, options?: ContentData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = {};
    }
    options = options || {};

    const data: any = { ...this._getOptions(options), title, url };
    if (data.tags && Array.isArray(data.tags)) {
      data.tags = data.tags.join(',');
    }
    return this.apiPost('content', data, callback!);
  }

  purchase(email: string, items: PurchaseItem[], options?: PurchaseData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = undefined;
    }
    const data = { ...this._getOptions(options), email, items };
    return this.apiPost('purchase', data, callback!);
  }

  stats(data: Record<string, any>, callback: ApiCallback): void {
    return this.apiGet('stats', data, callback);
  }

  statsList(options?: StatsData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = undefined;
    }
    options = options || {};

    const data = { ...this._getOptions(options), stat: 'list' };
    return this.stats(data, callback!);
  }

  statsBlast(options?: StatsData | ApiCallback, callback?: ApiCallback): void {
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = undefined;
    }
    options = options || {};

    const data = { ...this._getOptions(options), stat: 'blast' };
    return this.stats(data, callback!);
  }

  getJobStatus(jobId: string, callback: ApiCallback): void {
    return this.apiGet('job', { job_id: jobId }, callback);
  }

  processJob(
    job: string,
    options?: JobData | string | ApiCallback,
    report_email?: string | ApiCallback,
    postback_url?: string | ApiCallback,
    binary_data_params?: string[] | ApiCallback,
    callback?: ApiCallback
  ): void {
    // Handle various overloaded signatures
    if (typeof options === 'function') {
      callback = options as ApiCallback;
      options = undefined;
      report_email = undefined;
      postback_url = undefined;
      binary_data_params = [];
    } else if (typeof report_email === 'function') {
      callback = report_email;
      report_email = undefined;
      postback_url = undefined;
      binary_data_params = [];
    } else if (typeof postback_url === 'function') {
      callback = postback_url;
      postback_url = undefined;
      binary_data_params = [];
    } else if (typeof binary_data_params === 'function') {
      callback = binary_data_params;
      binary_data_params = [];
    }

    options = options || {} as JobData;
    binary_data_params = binary_data_params || [];

    const data = this._getOptions(options);
    data.job = job;
    if (report_email && typeof report_email === 'string') {
      data.report_email = report_email;
    }
    if (postback_url && typeof postback_url === 'string') {
      data.postback_url = postback_url;
    }

    return this.apiPost('job', data, binary_data_params as string[], callback!);
  }

  private checkForValidPostbackActions(required_keys: string[], post_params: Record<string, any>): boolean {
    if (!post_params || typeof post_params !== 'object') {
      return false;
    }
    
    for (const key of required_keys) {
      if (!(key in post_params)) {
        return false;
      }
    }
    return true;
  }

  receiveOptoutPost(params?: Record<string, any>): boolean {
    if (typeof params === 'undefined') {
      return false;
    }

    const required_params = ['action', 'email', 'sig'];
    if (!this.checkForValidPostbackActions(required_params, params)) {
      return false;
    }

    if (params['action'] !== 'optout') {
      return false;
    }

    const sig = params['sig'];
    delete params['sig'];

    if (sig !== SailthruUtil.getSignatureHash(params, this.api_secret)) {
      return false;
    } else {
      return true;
    }
  }

  receiveVerifyPost(params?: Record<string, any>): boolean {
    if (typeof params === 'undefined' || !params || typeof params !== 'object') {
      return false;
    }

    const required_params = ['action', 'email', 'send_id', 'sig'];
    if (!this.checkForValidPostbackActions(required_params, params)) {
      return false;
    }

    if (params['action'] !== 'verify') {
      return false;
    }

    const sig = params['sig'];
    const paramsForSig = { ...params };
    delete paramsForSig['sig'];

    if (sig !== SailthruUtil.getSignatureHash(paramsForSig, this.api_secret)) {
      return false;
    }

    // Note: The Python version does additional validation by calling get_send
    // and comparing email addresses. This requires an async API call.
    // For now, we'll implement the signature validation part only.
    // Users can extend this method if they need the additional send verification.
    return true;
  }

  receiveUpdatePost(params?: Record<string, any>): boolean {
    if (typeof params === 'undefined' || !params || typeof params !== 'object') {
      return false;
    }

    const required_params = ['action', 'email', 'sig'];
    if (!this.checkForValidPostbackActions(required_params, params)) {
      return false;
    }

    if (params['action'] !== 'update') {
      return false;
    }

    const sig = params['sig'];
    const paramsForSig = { ...params };
    delete paramsForSig['sig'];

    if (sig !== SailthruUtil.getSignatureHash(paramsForSig, this.api_secret)) {
      return false;
    }

    return true;
  }

  receiveHardbouncePost(params?: Record<string, any>): boolean {
    if (typeof params === 'undefined' || !params || typeof params !== 'object') {
      return false;
    }

    const required_params = ['action', 'email', 'sig'];
    if (!this.checkForValidPostbackActions(required_params, params)) {
      return false;
    }

    if (params['action'] !== 'hardbounce') {
      return false;
    }

    const sig = params['sig'];
    const paramsForSig = { ...params };
    delete paramsForSig['sig'];

    if (sig !== SailthruUtil.getSignatureHash(paramsForSig, this.api_secret)) {
      return false;
    }

    // Note: The Python version does additional validation for send_id and blast_id
    // by making API calls to verify the details. This requires async operations.
    // For now, we implement the signature validation part only.
    return true;
  }

  getLastRateLimitInfo(action: string, method: string): RateLimitInfo | undefined {
    return this.request.last_rate_limit_info['/' + action + '|' + method.toUpperCase()];
  }
}

// Factory functions for backwards compatibility
export function createSailthruClient(api_key: string, api_secret: string, options?: SailthruOptions): SailthruClient {
  return new SailthruClient(api_key, api_secret, options);
}

export function createClient(api_key: string, api_secret: string, options?: SailthruOptions): SailthruClient {
  return new SailthruClient(api_key, api_secret, options);
}

// Export types
export type {
  SailthruOptions,
  ApiResponse,
  ApiError,
  ApiCallback,
  RateLimitInfo,
  SendOptions,
  MultiSendOptions,
  SendResponse,
  UserProfile,
  BlastData,
  BlastStatus,
  TemplateData,
  TemplateResponse,
  ContentData,
  PurchaseItem,
  PurchaseData,
  JobData,
  JobStatus,
  StatsData,
  ListData,
  ListResponse,
  AlertData,
  EventData,
  WebhookParams,
} from './types';

// Default export for modern ESM usage
export default SailthruClient;