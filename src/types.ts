import * as http from 'http';

// Configuration Types
export interface SailthruOptions {
  apiUrl?: string;
  agent?: http.Agent;
}

export interface SailthruClientConfig {
  apiKey: string;
  apiSecret: string;
  options?: SailthruOptions;
}

// Response Types
export interface ApiResponse {
  ok?: boolean;
  error?: number;
  errormsg?: string;
  [key: string]: any;
}

export interface ApiError {
  statusCode: number;
  error: number;
  errormsg: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

// Callback Type
export type ApiCallback = (error: ApiError | null, response?: ApiResponse) => void;

// User Types
export interface UserProfile {
  id?: string;
  email?: string;
  keys?: Record<string, string>;
  vars?: Record<string, any>;
  lists?: Record<string, 0 | 1>;
  optout_email?: 'none' | 'basic' | 'blast' | 'all';
  sms?: string;
  sms_marketing_status?: 'opt-in' | 'opt-out' | 'not-set';
  [key: string]: any;
}

// Send Types
export interface SendOptions {
  vars?: Record<string, any>;
  options?: {
    test?: 0 | 1;
    replyto?: string;
    report_email?: string;
    cc?: string[];
    bcc?: string[];
    behalf_email?: string;
    tags?: string[];
    link_tracking?: 0 | 1;
    schedule_time?: string | number;
    [key: string]: any;
  };
  schedule_time?: string;
  limit?: {
    name?: string;
    past_time?: string;
    within?: number;
    unit?: 'user' | 'profile';
  };
  [key: string]: any;
}

export interface MultiSendOptions {
  evars?: Record<string, any>[];
  options?: SendOptions['options'];
  [key: string]: any;
}

export interface SendResponse extends ApiResponse {
  send_id?: string;
  email?: string;
  template?: string;
  status?: string;
}

// Template Types
export interface TemplateData {
  name?: string;
  subject?: string;
  content_html?: string;
  content_text?: string;
  content_sms?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  is_link_tracking?: boolean;
  is_google_analytics?: boolean;
  is_public?: boolean;
  setup?: string;
  sample?: string;
  [key: string]: any;
}

export interface TemplateResponse extends ApiResponse {
  template?: TemplateData;
  templates?: TemplateData[];
}

// List Types
export interface ListData {
  list?: string;
  emails?: string[];
  primary?: 0 | 1;
  public_name?: string;
  type?: 'normal' | 'smart';
  query?: Record<string, any>;
  vars?: Record<string, any>;
}

export interface ListResponse extends ApiResponse {
  list?: string;
  email_count?: number;
  lists?: Array<{
    list: string;
    list_id: string;
    type: string;
    email_count: number;
    create_time: string;
    [key: string]: any;
  }>;
}

// Blast/Campaign Types
export interface BlastData {
  name?: string;
  list?: string;
  schedule_time?: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  content_html?: string;
  content_text?: string;
  blast_id?: number;
  copy_blast?: number;
  copy_template?: string;
  replyto?: string;
  report_email?: string;
  is_link_tracking?: 0 | 1;
  is_google_analytics?: 0 | 1;
  is_public?: 0 | 1;
  suppress_list?: string[];
  test_vars?: Record<string, any>;
  email_hour_range?: number;
  abtest?: string;
  test_percent?: number;
  data_feed_url?: string;
  [key: string]: any;
}

export interface BlastStatus {
  status?: 'draft' | 'scheduled' | 'sending' | 'sent';
  name?: string;
  list?: string;
  blast_id?: number;
  schedule_time?: string;
  start_time?: string;
  finished_time?: string;
  email_count?: number;
  [key: string]: any;
}

// Content Types
export interface ContentData {
  title?: string;
  url?: string;
  date?: string | Date;
  expire_date?: string | Date;
  tags?: string[];
  vars?: Record<string, any>;
  images?: {
    full?: string;
    thumb?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  author?: string;
  price?: number;
  description?: string;
  site_name?: string;
  [key: string]: any;
}

// Purchase Types
export interface PurchaseItem {
  qty: number;
  title: string;
  price: number;
  id: string;
  url?: string;
  tags?: string[];
  vars?: Record<string, any>;
  images?: {
    full?: string;
    thumb?: string;
  };
  [key: string]: any;
}

export interface PurchaseData {
  email: string;
  items: PurchaseItem[];
  incomplete?: 0 | 1;
  message_id?: string;
  reminder_template?: string;
  reminder_time?: string;
  send_template?: string;
  transaction_time?: string;
  transaction_id?: string;
  vars?: Record<string, any>;
  adjustments?: Array<{
    title: string;
    price: number;
  }>;
  tenders?: Array<{
    title: string;
    price: number;
  }>;
  [key: string]: any;
}

// Alert Types
export interface AlertData {
  email: string;
  type: 'daily' | 'weekly';
  template: string;
  when?: {
    time?: string;
    weekday?: string;
  };
  options?: {
    match?: Record<string, any>;
    min?: Record<string, any>;
    max?: Record<string, any>;
    tags?: string[];
    vars?: Record<string, any>;
  };
  [key: string]: any;
}

// Job Types
export interface JobData {
  job: 'import' | 'export' | 'export_list' | 'update' | 'purchase_import' | 'content_import' | 'snapshot';
  list?: string;
  emails?: string[];
  file?: string;
  report_email?: string;
  postback_url?: string;
  update?: Record<string, any>;
  [key: string]: any;
}

export interface JobStatus extends ApiResponse {
  job_id?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  start_time?: string;
  end_time?: string;
  percent_done?: number;
  [key: string]: any;
}

// Stats Types
export interface StatsData {
  stat?: 'blast' | 'list' | 'send';
  list?: string;
  blast_id?: number;
  template?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  [key: string]: any;
}

// Event Types
export interface EventData {
  id: string;
  event: string;
  schedule_time?: string;
  vars?: Record<string, any>;
  [key: string]: any;
}

// Webhook Types
export interface WebhookParams {
  action?: string;
  email?: string;
  sig?: string;
  send_id?: string;
  template?: string;
  blast_id?: string;
  [key: string]: any;
}