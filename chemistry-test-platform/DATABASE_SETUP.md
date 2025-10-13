# Database Setup - Chemistry Test Platform

## ✅ Setup Complete!

Your Chemistry Test Platform now uses **PostgreSQL** for permanent data storage with **email validation** enabled.

## What's New

### 1. **PostgreSQL Database**
- All data is now stored permanently in PostgreSQL
- Data persists even after server restarts
- Database: `chemistry_test_db`
- Located at: `localhost:5432`

### 2. **Email Validation**
- ✅ Blocks disposable/temporary email services (tempmail, guerrillamail, etc.)
- ✅ Validates proper email format
- ✅ Allows major email providers (Gmail, Yahoo, Outlook, etc.)
- ✅ Can be configured to require educational emails (.edu, .ac.in)

### 3. **Database Tables Created**
- `users` - All teachers and students
- `tests` - All created tests
- `questions` - Test questions
- `test_attempts` - Student test submissions
- `student_answers` - Individual answers

## Running the Application

### Start Backend (with Database)
```bash
cd chemistry-test-platform/backend
node server-db.js
```

### Start Frontend
```bash
cd chemistry-test-platform/frontend
npm run dev
```

## Default Login Credentials

**Teacher Account:**
- Email: teacher@chemistry.com
- Password: admin123

**Test Student Account:**
- Email: student@gmail.com
- Password: test123

## Email Validation Settings

### Current Configuration
Located in: `backend/server-db.js` (line ~147)

```javascript
const emailValidation = validateEmail(email, {
  allowAnyDomain: true,           // Allow any email domain
  requireEducationalEmail: false  // Don't require .edu emails
});
```

### Options:

**1. Strict - Only Allow Specific Providers**
```javascript
allowAnyDomain: false  // Only Gmail, Yahoo, Outlook, etc.
```

**2. Require Educational Emails (for students only)**
```javascript
requireEducationalEmail: true  // Must have .edu, .ac.in, .edu.in
```

**3. Custom Allowed Domains**
Edit `backend/src/utils/emailValidator.js`:
```javascript
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yourschool.edu',
  'yourcollege.ac.in',
  // Add more...
];
```

## Database Commands

### View All Users
```bash
psql -d chemistry_test_db -c "SELECT id, email, name, role FROM users;"
```

### View All Tests
```bash
psql -d chemistry_test_db -c "SELECT id, title, duration_minutes, total_marks FROM tests;"
```

### View Test Attempts
```bash
psql -d chemistry_test_db -c "SELECT * FROM test_attempts;"
```

### Backup Database
```bash
pg_dump chemistry_test_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -d chemistry_test_db < backup_20241013.sql
```

## PostgreSQL Service Management

### Start PostgreSQL
```bash
brew services start postgresql@16
```

### Stop PostgreSQL
```bash
brew services stop postgresql@16
```

### Check PostgreSQL Status
```bash
brew services info postgresql@16
```

### Connect to Database
```bash
psql -d chemistry_test_db
```

## Data Storage Comparison

### Before (In-Memory)
- ❌ Data lost on server restart
- ❌ Limited scalability
- ✅ Fast for small datasets

### Now (PostgreSQL)
- ✅ **Permanent data storage**
- ✅ **Unlimited students and tests**
- ✅ **Production ready**
- ✅ **Data backup and recovery**
- ✅ **Email validation**

## Email Validation Examples

### ✅ Allowed Emails
- student@gmail.com
- teacher@outlook.com
- user@university.edu
- student@college.ac.in
- person@protonmail.com

### ❌ Blocked Emails
- user@tempmail.com
- test@guerrillamail.com
- fake@10minutemail.com
- random@mailinator.com

## Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
brew services info postgresql@16

# Restart if needed
brew services restart postgresql@16
```

### Can't Connect to Database
```bash
# Test connection
psql -d chemistry_test_db -c "SELECT 1;"
```

### Reset Database
```bash
# Drop and recreate
dropdb chemistry_test_db
createdb chemistry_test_db
psql -d chemistry_test_db -f backend/src/models/database.sql
```

## Future Enhancements

### Email Verification (Optional)
To add email verification with OTP/link:
1. Install nodemailer: `npm install nodemailer`
2. Configure email service (Gmail, SendGrid, AWS SES)
3. Update registration to send verification email
4. Add verification endpoint

### Analytics & Reports
- Teacher can view student performance
- Test completion rates
- Question difficulty analysis
- Time spent per question

## Files Created/Modified

✅ Created:
- `backend/server-db.js` - New PostgreSQL-powered server
- `backend/src/utils/emailValidator.js` - Email validation utilities
- `DATABASE_SETUP.md` - This documentation

✅ Modified:
- `backend/.env` - Added database credentials

## Next Steps

1. ✅ Your application is now running with PostgreSQL
2. Test creating tests and adding questions
3. Register students and take tests
4. All data will persist permanently!

---

**Need Help?**
- Check backend logs: Look at the terminal running `node server-db.js`
- View database: Use `psql -d chemistry_test_db`
- Test API: Use `curl http://localhost:5001/api/health`
