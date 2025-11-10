# 🗄️ Database Setup Guide - Nestify Security System

## 📋 Required Tables & Setup Instructions

### **Step 1: Core Application Tables**
Run `database/schema.sql` in Supabase SQL Editor:

#### **system_config**
- **Purpose**: Stores NestKey for admin registration
- **Action**: Update `nest_key` value for production
- **Default**: `NEST2025SECURE`

#### **admins**
- **Purpose**: Hostel owner accounts
- **Fields**: name, email, password_hash, hostel_name, stay_key, is_verified
- **Action**: No manual setup required

#### **tenants**
- **Purpose**: Tenant accounts linked to hostels
- **Fields**: name, email, password_hash, admin_id, registration_id, is_active
- **Action**: No manual setup required

#### **rooms**
- **Purpose**: Room inventory per hostel
- **Fields**: admin_id, room_number, room_type, rent_amount, is_occupied
- **Action**: No manual setup required

#### **bills**
- **Purpose**: Billing records and invoices
- **Fields**: tenant_id, admin_id, amount, due_date, status, bill_type
- **Action**: No manual setup required

#### **transactions**
- **Purpose**: Payment records via Razorpay
- **Fields**: bill_id, razorpay_order_id, amount, status, payment_method
- **Action**: No manual setup required

---

### **Step 2: Security Monitoring Tables**
Run `database/security_tables.sql` in Supabase SQL Editor:

#### **security_logs**
- **Purpose**: General security events
- **Fields**: event_type, details, ip_address, user_agent, severity
- **Auto-populated**: Login failures, suspicious activity

#### **login_logs**
- **Purpose**: All login attempts tracking
- **Fields**: user_id, user_type, ip_address, success, failure_reason
- **Auto-populated**: Every login attempt

#### **user_sessions**
- **Purpose**: Active session management
- **Fields**: user_id, session_token, refresh_token, expires_at
- **Auto-populated**: On login/logout

#### **password_history**
- **Purpose**: Prevent password reuse
- **Fields**: user_id, user_type, password_hash
- **Auto-populated**: On password changes

---

### **Step 3: Global Platform Security**
Run `database/global_security.sql` in Supabase SQL Editor:

#### **platform_sessions**
- **Purpose**: Global user session tracking (500 user limit)
- **Fields**: user_id, user_email, hostel_id, session_token, ip_address, device_type
- **Auto-populated**: Every login across all hostels
- **Monitor**: Active sessions, capacity usage

#### **platform_login_attempts**
- **Purpose**: Global login attempt monitoring
- **Fields**: email, user_type, ip_address, success, failure_reason, hostel_id
- **Auto-populated**: All login attempts platform-wide
- **Monitor**: Failed login patterns, security threats

#### **platform_security_events**
- **Purpose**: Global security incident tracking
- **Fields**: event_type, severity, user_email, hostel_id, ip_address, details
- **Auto-populated**: Security violations, capacity exceeded, brute force
- **Monitor**: Critical security events

#### **platform_stats**
- **Purpose**: Daily platform statistics
- **Fields**: date, total_active_sessions, total_failed_logins, unique_ips
- **Auto-populated**: Daily aggregated statistics
- **Monitor**: Platform health metrics

---

### **Step 4: Enable Security Logging**
Run `database/enable_security_logging.sql` in Supabase SQL Editor:

```sql
-- Removes RLS restrictions that block security logging
-- Enables proper data insertion into security tables
-- Adds test records to verify functionality
```

---

### **Step 5: Fix Security Permissions**
Run `database/fix_security_tables.sql` in Supabase SQL Editor:

```sql
-- Creates permissive policies for security logging
-- Ensures service role can write to security tables
-- Fixes any permission issues
```

---

## 🔍 **Monitoring Your Database**

### **Tables to Monitor Regularly:**

#### **High Priority - Security**
- `platform_sessions` - Current active users (should not exceed 500)
- `platform_login_attempts` - Failed login patterns
- `platform_security_events` - Critical security incidents

#### **Medium Priority - Operations**
- `login_logs` - User activity patterns
- `security_logs` - General security events
- `transactions` - Payment processing status

#### **Low Priority - Maintenance**
- `user_sessions` - Session cleanup needed
- `password_history` - Password policy compliance
- `platform_stats` - Historical trends

---

## 🚨 **Critical Alerts to Watch**

### **Immediate Action Required:**
- `platform_sessions` count approaching 500
- Multiple failed logins from same IP in `platform_login_attempts`
- `CAPACITY_EXCEEDED` events in `platform_security_events`

### **Daily Review:**
- Failed login count in `platform_login_attempts`
- New security events in `platform_security_events`
- Session cleanup in `user_sessions`

### **Weekly Review:**
- Platform usage trends in `platform_stats`
- Password change patterns in `password_history`
- Overall security posture assessment

---

## 🛠️ **Maintenance Queries**

### **Check Active Sessions:**
```sql
SELECT COUNT(*) as active_users FROM platform_sessions WHERE is_active = true;
```

### **View Failed Logins Today:**
```sql
SELECT * FROM platform_login_attempts 
WHERE success = false AND created_at >= CURRENT_DATE;
```

### **Security Events by Severity:**
```sql
SELECT severity, COUNT(*) FROM platform_security_events 
WHERE created_at >= CURRENT_DATE 
GROUP BY severity;
```

### **Cleanup Old Sessions:**
```sql
DELETE FROM user_sessions WHERE expires_at < NOW();
```

---

## ⚠️ **Important Notes**

1. **Never delete security tables** - They contain audit trails
2. **Monitor platform_sessions** - Enforce 500 user limit
3. **Review failed logins daily** - Detect security threats
4. **Backup security data** - Critical for compliance
5. **Run cleanup queries weekly** - Maintain performance