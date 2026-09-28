CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX leads_name_search_idx ON leads USING gin (name gin_trgm_ops) WHERE archived_at IS NULL;
CREATE INDEX leads_phone_search_idx ON leads USING gin (phone gin_trgm_ops) WHERE archived_at IS NULL;
CREATE INDEX leads_email_search_idx ON leads USING gin (email gin_trgm_ops) WHERE archived_at IS NULL AND email IS NOT NULL;
CREATE INDEX conversations_display_name_search_idx ON conversations USING gin (display_name gin_trgm_ops) WHERE status='open' AND display_name IS NOT NULL;
CREATE INDEX conversations_phone_search_idx ON conversations USING gin (phone gin_trgm_ops) WHERE status='open';
CREATE INDEX conversation_messages_content_search_idx ON conversation_messages USING gin (content gin_trgm_ops) WHERE content IS NOT NULL;
