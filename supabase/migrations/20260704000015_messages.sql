-- PrinceSteve Residence Migration 15: Direct messages
-- The messaging UI (dashboard/messages) reads/writes a `messages` table that
-- did not exist. Create it with RLS so a user can only read messages they are
-- part of and can only send as themselves.

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 5000),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_participant_select ON messages;
CREATE POLICY messages_participant_select ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS messages_sender_insert ON messages;
CREATE POLICY messages_sender_insert ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS messages_receiver_update ON messages;
CREATE POLICY messages_receiver_update ON messages
  FOR UPDATE USING (receiver_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
