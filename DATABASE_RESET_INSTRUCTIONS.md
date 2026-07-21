# Database Reset Instructions

## 🚨 **WARNING: This will delete ALL data**

Before proceeding with the database reset, please understand:

### **What will be deleted:**
- ✅ All user accounts (auth.users)
- ✅ All user profiles (profiles)
- ✅ All properties and units
- ✅ All tenants and payments
- ✅ All applicants and tickets
- ✅ All messages and activity logs
- ✅ All settings and configurations
- ✅ All sequences will be reset

### **What will be preserved:**
- ✅ Database schema and tables
- ✅ Functions and triggers
- ✅ RLS policies and security settings
- ✅ Extensions (btree_gist, etc.)

## **Reset Options:**

### **Option 1: Complete Database Reset**
```sql
-- Run this in Supabase SQL Editor
-- Copy and execute the complete reset script
```

### **Option 2: Controlled Cleanup (Recommended)**
```sql
-- Run this in Supabase SQL Editor  
-- This preserves properties and units but deletes user data
```

## **Steps to Reset:**

1. **Backup your current data** (if needed)
2. **Choose your reset option** above
3. **Copy the SQL script** to Supabase SQL Editor
4. **Execute the script** in Supabase
5. **Verify the cleanup** using the verification queries
6. **Test the application** to ensure it works with fresh data

## **After Reset:**

1. **Create new admin user** through the application
2. **Set up properties and units** 
3. **Configure settings** through the admin dashboard
4. **Test user registration** and login functionality
5. **Verify all features** work as expected

## **Important Notes:**

- ⚠️ **This action cannot be undone** - all data will be permanently deleted
- 🔐 **Security settings will be preserved** - RLS policies and functions remain intact
- 🔄 **Sequences will reset** - receipt numbers will start from 1 again
- 📱 **Mobile apps will need to re-register** users

## **Verification Queries:**

After running the cleanup script, run these queries to confirm everything was deleted:

```sql
-- Should return 0
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM properties;
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM applicants;
SELECT COUNT(*) FROM tickets;
```

## **Contact Support:**

If you encounter any issues during the reset process, please contact support.

---

**⚠️ WARNING: Make sure you have backed up any important data before proceeding with the reset.**