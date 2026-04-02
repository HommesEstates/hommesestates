# REST API Odoo Module - Audit & Implementation Plan

## Module Overview

**Module:** `rest_api_odoo` (Odoo REST API by Cybrosys)  
**Version:** 18.0.1.0.1  
**Location:** `c:/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/`

---

## Current Capabilities

### 1. API Key Management
- **Location:** `models/res_users.py`
- **Mechanism:** UUID-based API keys stored in `res.users.api_key` field
- **Generation:** Automatic via `/odoo_connect` endpoint or programmatically via `generate_api()` method
- **Display:** Read-only field in User form under "API" tab

### 2. Authentication Flow
```
1. Client calls /odoo_connect with login/password/db headers
2. Odoo authenticates user session
3. API key is generated (if not exists) via generate_api()
4. API key returned in JSON response
5. Subsequent calls to /send_request require:
   - api-key header (for authorization)
   - login/password headers (for session auth)
```

### 3. API Endpoints

#### `/odoo_connect` (GET)
**Purpose:** Initialize API connection and generate API key  
**Headers Required:**
- `login`: Odoo username
- `password`: Odoo password  
- `db`: Database name

**Response:**
```json
{
  "Status": "auth successful",
  "User": "User Name",
  "api-key": "uuid-generated-key"
}
```

#### `/send_request` (GET/POST/PUT/DELETE)
**Purpose:** CRUD operations on configured models  
**Headers Required:**
- `api-key`: Generated API key
- `login`: Odoo username
- `password`: Odoo password
- `Content-Type: application/json`

**URL Parameters:**
- `model`: Model name (e.g., `res.partner`)
- `Id`: Record ID (optional, for single record operations)

**Request Body (JSON):**
```json
{
  "fields": ["name", "email", "phone"],
  "values": {"name": "Test", "email": "test@test.com"}
}
```

### 4. Connection API Model (`connection.api`)
**Purpose:** Configure which models can be accessed via REST API  
**Fields:**
- `model_id`: Target model (Many2one to ir.model)
- `is_get`: Enable GET method
- `is_post`: Enable POST method
- `is_put`: Enable PUT method
- `is_delete`: Enable DELETE method

**Access:** Settings → Rest API → Rest API Records

---

## Current Limitations

### Critical Issues
1. **No Direct UI for API Key Generation**
   - Users must call `/odoo_connect` endpoint manually
   - No "Generate API Key" button in user interface
   - API key field is read-only

2. **No API Key Lifecycle Management**
   - No regenerate/revoke functionality
   - No expiration dates
   - No usage tracking/logging
   - No ability to disable/enable keys

3. **Dual Authentication Required**
   - Must provide both API key AND login/password for every request
   - Not true "API key-only" authentication

4. **No Permissions Per Key**
   - API keys inherit user's full permissions
   - No granular access control per key

5. **No Developer Documentation UI**
   - No in-app API documentation
   - No endpoint testing interface

### Minor Issues
- HTML error responses instead of JSON
- No rate limiting
- No request logging/auditing
- No webhook support

---

## Implementation Plan

### Phase 1: Core API Key UI Enhancements (High Priority)

#### 1.1 User Profile API Key Management
**File:** `views/res_users_views.xml`  
**Changes:**
```xml
<page string="API" name="rest-api">
    <group>
        <field name="api_key" groups="base.group_user" readonly="1"/>
        <button name="action_generate_api_key" 
                string="Generate API Key" 
                type="object"
                class="oe_highlight"
                attrs="{'invisible': [('api_key', '!=', False)]}"/>
        <button name="action_revoke_api_key" 
                string="Revoke" 
                type="object"
                class="oe_danger"
                attrs="{'invisible': [('api_key', '=', False)]}"/>
        <button name="action_regenerate_api_key" 
                string="Regenerate" 
                type="object"
                attrs="{'invisible': [('api_key', '=', False)]}"/>
    </group>
    <group string="API Usage" attrs="{'invisible': [('api_key', '=', False)]}">
        <field name="api_key_created" readonly="1"/>
        <field name="api_key_last_used" readonly="1"/>
        <field name="api_key_usage_count" readonly="1"/>
    </group>
</page>
```

#### 1.2 Enhanced User Model
**File:** `models/res_users.py`  
**Add Fields:**
```python
api_key_created = fields.Datetime(string="API Key Created", readonly=True)
api_key_last_used = fields.Datetime(string="Last Used", readonly=True)
api_key_usage_count = fields.Integer(string="Usage Count", default=0)
```

**Add Methods:**
```python
def action_generate_api_key(self):
    """Generate new API key for user"""
    for user in self:
        user.api_key = str(uuid.uuid4())
        user.api_key_created = fields.Datetime.now()
        user.api_key_usage_count = 0
    return {
        'type': 'ir.actions.client',
        'tag': 'display_notification',
        'params': {
            'title': _('API Key Generated'),
            'message': _('Your API key has been generated successfully.'),
            'sticky': False,
        }
    }

def action_revoke_api_key(self):
    """Revoke API key"""
    for user in self:
        user.api_key = False
        user.api_key_created = False
        user.api_key_last_used = False
        user.api_key_usage_count = 0
    return {
        'type': 'ir.actions.client',
        'tag': 'display_notification',
        'params': {
            'title': _('API Key Revoked'),
            'message': _('Your API key has been revoked.'),
            'sticky': False,
        }
    }

def action_regenerate_api_key(self):
    """Regenerate API key (revoke old, create new)"""
    self.action_revoke_api_key()
    return self.action_generate_api_key()
```

### Phase 2: Standalone API Key Management Module (Medium Priority)

#### 2.1 New Model: `api.key`
**File:** `models/api_key.py`
```python
class ApiKey(models.Model):
    _name = 'api.key'
    _description = 'API Key'
    _inherit = ['mail.thread']
    
    name = fields.Char(string="Name", required=True, tracking=True)
    user_id = fields.Many2one('res.users', string="User", required=True, tracking=True)
    key = fields.Char(string="API Key", readonly=True, copy=False)
    state = fields.Selection([
        ('active', 'Active'),
        ('revoked', 'Revoked'),
        ('expired', 'Expired'),
    ], string="Status", default='active', tracking=True)
    
    # Access control
    model_ids = fields.Many2many('ir.model', string="Allowed Models")
    allowed_ips = fields.Text(string="Allowed IPs", help="One IP per line. Leave empty to allow all.")
    
    # Lifecycle
    created_at = fields.Datetime(string="Created", default=fields.Datetime.now, readonly=True)
    expires_at = fields.Datetime(string="Expires", tracking=True)
    last_used_at = fields.Datetime(string="Last Used", readonly=True)
    usage_count = fields.Integer(string="Usage Count", default=0)
    
    def generate_key(self):
        """Generate new API key"""
        self.key = f"hek_{uuid.uuid4().hex}"
        return self.key
    
    def action_revoke(self):
        self.write({'state': 'revoked'})
    
    def action_activate(self):
        self.write({'state': 'active'})
```

#### 2.2 API Key Management Views
**Menu Structure:**
- Settings → Technical → API → API Keys
- Settings → Technical → API → API Access Logs

**List View:**
- Name, User, Status, Created, Expires, Last Used, Usage Count

**Form View:**
- Name, User, Key (copy button), Status
- Allowed Models (many2many)
- Allowed IPs (text area)
- Lifecycle tab (created, expires, last used, usage count)

### Phase 3: Enhanced Authentication (Medium Priority)

#### 3.1 API-Key-Only Authentication Option
**Modify:** `controllers/rest_api_odoo.py`  
**New authentication decorator:**
```python
def auth_api_key_only(self, api_key):
    """Authenticate using API key only (no session required)"""
    api_key_record = request.env['api.key'].sudo().search([
        ('key', '=', api_key),
        ('state', '=', 'active'),
    ], limit=1)
    
    if not api_key_record:
        return False, "Invalid API Key"
    
    # Check expiration
    if api_key_record.expires_at and api_key_record.expires_at < fields.Datetime.now():
        api_key_record.state = 'expired'
        return False, "API Key Expired"
    
    # Check IP restriction
    if api_key_record.allowed_ips:
        client_ip = request.httprequest.remote_addr
        allowed_ips = [ip.strip() for ip in api_key_record.allowed_ips.split('\n')]
        if client_ip not in allowed_ips:
            return False, "IP Not Allowed"
    
    # Update usage stats
    api_key_record.write({
        'last_used_at': fields.Datetime.now(),
        'usage_count': api_key_record.usage_count + 1,
    })
    
    # Set user context
    request.env = api.env(user=api_key_record.user_id.id)
    
    return True, api_key_record
```

### Phase 4: API Documentation & Testing (Low Priority)

#### 4.1 API Documentation Dashboard
**New Menu:** Settings → Technical → API → API Documentation

**Features:**
- List of configured models with allowed methods
- Example requests/responses
- "Test Endpoint" button for each model
- Copy-to-clipboard curl commands

#### 4.2 API Access Logs
**Model:** `api.access.log`
```python
class ApiAccessLog(models.Model):
    _name = 'api.access.log'
    _description = 'API Access Log'
    
    api_key_id = fields.Many2one('api.key', string="API Key")
    user_id = fields.Many2one('res.users', string="User")
    endpoint = fields.Char(string="Endpoint")
    method = fields.Char(string="HTTP Method")
    model = fields.Char(string="Model")
    record_id = fields.Integer(string="Record ID")
    timestamp = fields.Datetime(string="Timestamp", default=fields.Datetime.now)
    ip_address = fields.Char(string="IP Address")
    response_status = fields.Integer(string="Response Status")
```

### Phase 5: Real Estate Module Integration (High Priority)

#### 5.1 Configure Real Estate Models for API Access
**Action:** Create `connection.api` records for:
- `real.estate.property` (GET, POST, PUT)
- `real.estate.block` (GET)
- `real.estate.floor` (GET)
- `real.estate.suite` (GET, POST, PUT)
- `real.estate.offer` (GET, POST)

#### 5.2 Public Endpoints (No Auth Required)
**Modify:** `controllers/api_public.py` to work with rest_api_odoo
OR create wrapper endpoints that use both systems.

---

## Implementation Steps (Recommended Order)

### Step 1: Immediate Fix (Today)
1. Configure real estate models in Connection API
2. Generate API key via `/odoo_connect` endpoint
3. Update frontend `.env.local` with correct API key

### Step 2: UI Enhancement (This Week)
1. Update `res_users_views.xml` with Generate/Revoke buttons
2. Update `res_users.py` with action methods
3. Test API key generation from user profile

### Step 3: Production Ready (Next Sprint)
1. Create standalone `api.key` model
2. Implement API-Key-Only authentication option
3. Add API access logging
4. Create API documentation dashboard

---

## Current Quick Fix: Generate API Key Now

Since the module is installed, here's how to generate an API key immediately:

### Option 1: Via curl
```bash
curl -X GET "https://www.hommesestates.com/odoo_connect" \
  -H "login: adegoketest@gmail.com" \
  -H "password: Heph316@H!" \
  -H "db: hommesestates"
```

### Option 2: Via Python (Odoo Shell)
```python
env['res.users'].sudo().search([('login', '=', 'adegoketest@gmail.com')]).generate_api('adegoketest@gmail.com')
```

### Option 3: Wait for UI Enhancement
After implementing Phase 1, users can:
1. Go to Settings → Users → Select user
2. Click "API" tab
3. Click "Generate API Key" button

---

## Files to Modify

### Immediate Changes:
1. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/views/res_users_views.xml`
2. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/models/res_users.py`
3. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/security/ir.model.access.csv` (add new field permissions)

### Next Phase:
4. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/models/api_key.py` (new)
5. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/views/api_key_views.xml` (new)
6. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/models/api_access_log.py` (new)
7. `/Program Files/Odoo 18.0.20250316/server/addons/rest_api_odoo/controllers/rest_api_odoo.py` (enhanced auth)

---

## Next Action Required

**Would you like me to:**
1. Implement Phase 1 (UI buttons for Generate/Revoke API Key) now?
2. Configure real estate models in Connection API first?
3. Generate API key manually and test the current system?
