-- Suggestions table
CREATE TABLE suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'improvement', 'bug')),
  game TEXT NOT NULL,
  message TEXT NOT NULL,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ip_hash TEXT
);

-- Votes tracking (prevent double voting)
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id UUID REFERENCES suggestions(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(suggestion_id, voter_hash)
);

-- Enable RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read approved suggestions
CREATE POLICY "Anyone can read approved suggestions"
  ON suggestions FOR SELECT
  USING (status = 'approved');

-- Anyone can insert suggestions (moderated before visible)
CREATE POLICY "Anyone can submit suggestions"
  ON suggestions FOR INSERT
  WITH CHECK (true);

-- Anyone can read votes
CREATE POLICY "Anyone can read votes"
  ON votes FOR SELECT
  USING (true);

-- Anyone can insert votes
CREATE POLICY "Anyone can vote"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Function to vote (atomic increment)
CREATE OR REPLACE FUNCTION vote_suggestion(sid UUID, vhash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  already_voted BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM votes WHERE suggestion_id = sid AND voter_hash = vhash) INTO already_voted;
  IF already_voted THEN
    RETURN FALSE;
  END IF;
  INSERT INTO votes (suggestion_id, voter_hash) VALUES (sid, vhash);
  UPDATE suggestions SET votes = votes + 1 WHERE id = sid;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve/reject (for admin use via service role)
CREATE OR REPLACE FUNCTION moderate_suggestion(sid UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE suggestions SET status = new_status WHERE id = sid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
