# Database Setup

## Create Users Table

Run the migration script to create the users table in your Neon database:

```bash
# Make sure you're in the backend directory
cd backend

# Run the migration (requires DATABASE_URL in .env)
npm run migrate
```

**Alternative methods:**

1. **Using Neon Console** (if you don't have Node.js):
   - Go to your Neon dashboard
   - Open the SQL Editor
   - Copy and paste the contents of `src/db/schema.sql` and run it

2. **Using psql** (if installed):
   ```bash
   psql $DATABASE_URL -f src/db/schema.sql
   ```

The schema creates:
- `users` table with email, password_hash, name, google_id, avatar_url
- Indexes on email and google_id for faster lookups

## Environment Variables

Make sure your `backend/.env` file includes:

```
DATABASE_URL=your_neon_connection_string
PORT=4000
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production
```

**Important**: Change `JWT_SECRET` to a strong random string in production!

## Testing Authentication

1. Start the backend: `npm run dev`
2. Test signup:
   ```bash
   curl -X POST http://localhost:4000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

3. Test login:
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

