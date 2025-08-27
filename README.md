sailthru-node-client
====================

Node.js client for the [Sailthru REST API](https://getstarted.sailthru.com/developers/api) with full TypeScript support.

Features:
- ✅ CommonJS and ES modules support
- ✅ TypeScript definitions with comprehensive types
- ✅ Promise and callback support
- ✅ Rate limiting tracking
- ✅ Webhook validation

For full API documentation, see the [Sailthru API Reference](https://getstarted.sailthru.com/developers/api).

Installation
------------

```bash
npm install sailthru-client
```

Usage
-----

### CommonJS
```js
const { createSailthruClient } = require('sailthru-client');
const sailthru = createSailthruClient(apiKey, apiSecret);
```

### ES Modules
```js
import { createSailthruClient } from 'sailthru-client';
const sailthru = createSailthruClient(apiKey, apiSecret);
```

### TypeScript
```typescript
import { 
  createSailthruClient, 
  SailthruClient,
  ApiResponse,
  SendOptions,
  UserProfile,
  BlastData,
  PurchaseItem 
} from 'sailthru-client';

const sailthru = createSailthruClient(apiKey, apiSecret);

// TypeScript provides full type checking and IntelliSense
const sendOptions: SendOptions = {
  vars: { name: 'John' },
  options: { 
    test: 1,
    replyto: 'support@example.com' 
  }
};

sailthru.send('welcome-email', 'user@example.com', sendOptions, (err, response) => {
  if (err) {
    console.error(err.errormsg);
  } else {
    console.log(response.send_id);
  }
});
```

### Configuration

```js
const sailthru = createSailthruClient(apiKey, apiSecret, {
  apiUrl: 'api.sailthru.com', // optional - defaults to api.sailthru.com
  agent: httpAgent            // optional HTTP agent for proxy support
});
```

### Version

```js
const { VERSION } = require('sailthru-client');
```

API Methods
-----------

### Basic API Calls

Direct access to GET, POST, and DELETE endpoints:

```js
sailthru.apiGet(endpoint, data, callback);
sailthru.apiPost(endpoint, data, callback);
sailthru.apiDelete(endpoint, data, callback);
```

### Multipart Requests

For uploading files with your API calls:

```js
const data = { job: 'import', list: 'my-list', file: './emails.txt' };
sailthru.apiPost('job', data, ['file'], callback);
```

### [Send](https://getstarted.sailthru.com/developers/api/send)

```js
// Send a single email
const template = 'my-template';
const email = 'foo@example.com';
const options = {
        'vars': {
            'name': 'Foo Bar',
            'address': 'Queens, NY'
        },
        'options': {
            'test': 1,
            'replyto': 'bar@example.com'
        }
    };
sailthru.send(template, email, options, function(err, response) {
    if (err) {
        console.log("Status Code: " + err.statusCode);
        console.log("Error Code: " + err.error);
        console.log("Error Message: " + err.errormsg);
    } else {
        //process output
    }
});

// Multi-send to multiple recipients
sailthru.multiSend(template, 'all-users-list', options, function(err, response) {
    // handle response
});

// Get send status
sailthru.getSend('send-id-here', function(err, response) {
    // handle response
});
```

### [User](https://getstarted.sailthru.com/developers/api/user)

```js
// Get user profile by email
const email = 'foo@example.com';
sailthru.getUserByKey(email, 'email', function(err, response) {
    if (err) {
        console.log(err);
    } else {
        console.log(response);
    }
});

// Update user profile
const userData = {
    'vars': {
        'name': 'Foo Bar',
        'has_purchased': true
    },
    'lists': {
        'newsletter': 1,  // Subscribe to newsletter list
        'promotions': 0   // Unsubscribe from promotions list
    }
};
sailthru.saveUserByKey(email, 'email', userData, function(err, response) {
    // handle response
});

// Get user by session ID
sailthru.getUserBySid('session-id-here', function(err, response) {
    // handle response
});
```

### [List](https://getstarted.sailthru.com/developers/api/list)

```js
// Get all lists
sailthru.getLists(function(err, response) {
    if (!err) {
        console.log(response.lists);
    }
});

// Get specific list details
sailthru.getList('newsletter', function(err, response) {
    // handle response
});

// Create or update a list with emails
const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
sailthru.saveList('my-list', emails, function(err, response) {
    // handle response
});

// Delete a list
sailthru.deleteList('old-list', function(err, response) {
    // handle response
});
```

### [Template](https://getstarted.sailthru.com/developers/api/template)

```js
// Get all templates
sailthru.getTemplates(function(err, response) {
    if (!err) {
        console.log(response.templates);
    }
});

// Get specific template
sailthru.getTemplate('welcome-email', function(err, response) {
    // handle response
});

// Create or update a template
const templateData = {
    'subject': 'Welcome {name}!',
    'content_html': '<h1>Welcome aboard, {name}!</h1>',
    'content_text': 'Welcome aboard, {name}!',
    'from_name': 'My Company',
    'from_email': 'welcome@example.com'
};
sailthru.saveTemplate('welcome-email', templateData, function(err, response) {
    // handle response
});

// Delete a template
sailthru.deleteTemplate('old-template', function(err, response) {
    // handle response
});
```

### [Alert](https://getstarted.sailthru.com/developers/api/alert)

```js
// Get alerts for a user
const email = 'user@example.com';
sailthru.getAlert(email, function(err, response) {
    if (!err) {
        console.log(response.alerts);
    }
});

// Create a daily alert
const options = {
    'vars': {
        'item_count': 5
    },
    'criteria': {
        'interest': {'tags': ['sports', 'tech']}
    }
};
sailthru.saveAlert(email, 'daily', 'daily-digest', '+2 hours', options, function(err, response) {
    // handle response
});

// Delete an alert
sailthru.deleteAlert(email, 'alert-id-here', function(err, response) {
    // handle response
});
```

### [Job](https://getstarted.sailthru.com/developers/api/job)

```js
// Import users from a CSV file
const jobData = {
    'job': 'import',
    'list': 'newsletter-subscribers',
    'file': './subscribers.csv'
};
sailthru.processJob(jobData, ['file'], function(err, response) {
    if (!err) {
        console.log('Job ID: ' + response.job_id);
    }
});

// Export users to CSV
const exportJob = {
    'job': 'export_list',
    'list': 'newsletter-subscribers'
};
sailthru.processJob(exportJob, function(err, response) {
    // handle response
});

// Check job status
sailthru.getJobStatus('job-id-here', function(err, response) {
    if (!err) {
        console.log('Status: ' + response.status);
        console.log('Percent Done: ' + response.percent_done);
    }
});
```

### [Content](https://getstarted.sailthru.com/developers/api/content)

```js
// Push content to Sailthru
const title = 'New Blog Post: Understanding Node.js';
const url = 'https://example.com/blog/understanding-nodejs';
const options = {
    'tags': ['nodejs', 'javascript', 'programming'],
    'author': 'John Doe',
    'description': 'A comprehensive guide to Node.js',
    'image_thumb': 'https://example.com/thumb.jpg'
};
sailthru.pushContent(title, url, options, function(err, response) {
    // handle response
});

// Track a purchase
const email = 'customer@example.com';
const items = [
    {
        'qty': 1,
        'title': 'Product Name',
        'price': 2999,  // price in cents
        'id': 'product-123',
        'url': 'https://example.com/product-123'
    }
];
const purchaseOptions = {
    'message_id': 'message-id-here',
    'vars': {
        'order_id': '12345'
    }
};
sailthru.purchase(email, items, purchaseOptions, function(err, response) {
    // handle response
});
```

### [Stats](https://getstarted.sailthru.com/developers/api/stats)

```js
// Get general stats
const statOptions = {
    'stat': 'blast',
    'start_date': '2024-01-01',
    'end_date': '2024-01-31'
};
sailthru.stats(statOptions, function(err, response) {
    // handle response
});

// Get list stats
const listOptions = {
    'list': 'newsletter',
    'start_date': '2024-01-01'
};
sailthru.statsList(listOptions, function(err, response) {
    // handle response
});

// Get campaign/blast stats
const blastOptions = {
    'blast_id': 'blast-id-here',
    'start_date': '2024-01-01'
};
sailthru.statsBlast(blastOptions, function(err, response) {
    // handle response
});
```

### [Import Contacts](https://getstarted.sailthru.com/developers/api/contacts)

```js
// Import contacts from Gmail, Yahoo, AOL, etc.
const email = 'user@gmail.com';
const password = 'user-password';
const includeNames = true;  // Include contact names

sailthru.importContacts(email, password, includeNames, function(err, response) {
    if (err) {
        console.log('Import failed: ' + err.errormsg);
    } else {
        console.log('Contacts imported successfully');
    }
});
```

### [Webhook Validation](https://getstarted.sailthru.com/developers/webhooks)

```js
// Validate incoming webhook POST data
// These methods return true if the webhook signature is valid

// Optout webhook
app.post('/webhook/optout', function(req, res) {
    if (sailthru.receiveOptoutPost(req.body)) {
        // Process valid optout
        console.log('User opted out: ' + req.body.email);
        res.send('OK');
    } else {
        res.status(403).send('Invalid signature');
    }
});

// Email verification webhook
app.post('/webhook/verify', function(req, res) {
    if (sailthru.receiveVerifyPost(req.body)) {
        // Process verification
        res.send('OK');
    } else {
        res.status(403).send('Invalid signature');
    }
});

// Profile update webhook  
app.post('/webhook/update', function(req, res) {
    if (sailthru.receiveUpdatePost(req.body)) {
        // Process profile update
        res.send('OK');
    } else {
        res.status(403).send('Invalid signature');
    }
});

// Hardbounce webhook
app.post('/webhook/hardbounce', function(req, res) {
    if (sailthru.receiveHardbouncePost(req.body)) {
        // Process hardbounce
        res.send('OK');
    } else {
        res.status(403).send('Invalid signature');
    }
});
```

### Rate Limiting

```js
// After making an API call, check rate limit status
sailthru.send(template, email, options, function(err, response) {
    // Check rate limits for the send endpoint
    const rateLimitInfo = sailthru.getLastRateLimitInfo('send', 'POST');
    
    if (rateLimitInfo) {
        console.log('Rate limit: ' + rateLimitInfo.limit);         // e.g., 1000
        console.log('Remaining: ' + rateLimitInfo.remaining);      // e.g., 999
        console.log('Reset time: ' + rateLimitInfo.reset);         // Unix timestamp
        
        if (rateLimitInfo.remaining < 100) {
            console.log('Warning: Approaching rate limit');
        }
    }
});
```

TypeScript Types
----------------

The library exports comprehensive TypeScript definitions:

```typescript
// Configuration
SailthruOptions      // Client configuration options
SailthruClient       // Main client class

// API Types
ApiResponse          // Generic API response
ApiError            // Error response structure
ApiCallback         // Callback function type
RateLimitInfo       // Rate limit information

// Request/Response Types
UserProfile         // User profile data
SendOptions         // Email send options
SendResponse        // Send API response
BlastData          // Campaign/blast configuration
BlastStatus        // Campaign status information
TemplateData       // Email template data
TemplateResponse   // Template API response
ContentData        // Content item data
PurchaseItem       // E-commerce purchase item
PurchaseData       // Purchase transaction data
JobData            // Job configuration
JobStatus          // Job status information
StatsData          // Statistics query parameters
ListData           // List configuration
ListResponse       // List API response
AlertData          // Alert configuration
EventData          // Event tracking data
WebhookParams      // Webhook validation parameters
```

All types include proper field definitions with TypeScript IntelliSense support.

Development
-----------

```bash
npm install   # Install dependencies
npm test      # Run test suite
npm run build # Build distribution files
```
