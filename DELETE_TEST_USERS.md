# Delete Test Users from Database

## Quick Command to Delete All Test Users

Run this SQL command to delete all users EXCEPT your admin account:

```sql
-- Delete all users except teacher@chemistry.com
DELETE FROM users WHERE email != 'teacher@chemistry.com';
```

---

## Step-by-Step Instructions:

### 1. Connect to Render Database

Open Terminal and run:

```bash
PGPASSWORD=0zIF5xYGfxSz8IMi2IpGiK0NPOb7ozvl psql -h dpg-d3mcetidbo4c73boac30-a.oregon-postgres.render.com -U chemistry_test_db_user chemistry_test_db
```

### 2. Delete Test Users

Copy and paste this command:

```sql
DELETE FROM users WHERE email != 'teacher@chemistry.com';
```

### 3. Verify

Check remaining users:

```sql
SELECT id, email, name, role, is_email_verified FROM users;
```

You should only see `teacher@chemistry.com` remaining.

### 4. Exit

Type `\q` and press Enter.

---

## Alternative: Delete Specific Test Emails

If you want to delete only specific test emails:

```sql
-- Delete specific test users
DELETE FROM users WHERE email IN (
  'teststudent999@gmail.com',
  'teststudent@example.com',
  'newstudent@test.com',
  'teststudent123@gmail.com'
);
```

---

## Alternative: Delete All Students (Keep Teachers)

```sql
-- Delete all students, keep all teachers
DELETE FROM users WHERE role = 'student';
```

---

## Important Notes:

- ⚠️ This will also delete any test attempts/answers by those users (cascading delete)
- ✅ Your admin account (`teacher@chemistry.com`) will NOT be deleted
- ✅ Safe to run - database has proper foreign key constraints

---

## After Deletion:

Fresh start! All test users are gone. Students can now register with real emails and verify properly.
