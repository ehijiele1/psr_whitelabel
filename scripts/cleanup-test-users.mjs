import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://topvvizfllbuuhgliujk.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHZ2aXpmbGxidXVoZ2xpdWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk5MDIyNCwiZXhwIjoyMDk5NTY2MjI0fQ.xxsObuOkjCLLPReixMLBHy2PcOH7Ie6HATEA8zKfTqM'

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const testEmails = [
  'testowner@example.com',
  'testowner2@example.com',
  'testowner3@example.com',
  'testowner4@example.com',
  'testowner5@example.com',
  'testfinal@example.com',
  'testretry@example.com'
]

async function deleteTestUsers() {
  for (const email of testEmails) {
    const { data: users } = await admin.auth.admin.listUsers()
    const user = users.users.find(u => u.email === email)
    if (user) {
      const { error } = await admin.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`Failed to delete ${email}:`, error.message)
      } else {
        console.log(`Deleted ${email}`)
      }
    } else {
      console.log(`${email} not found`)
    }
  }
}

deleteTestUsers()