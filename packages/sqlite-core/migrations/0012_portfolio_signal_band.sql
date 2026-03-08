ALTER TABLE portfolio_projects
  ADD COLUMN signal_band TEXT CHECK (signal_band IN ('low', 'watch', 'high'));

UPDATE portfolio_projects
SET signal_band = COALESCE(signal_band, confidence_band, 'watch')
WHERE signal_band IS NULL;

CREATE INDEX IF NOT EXISTS idx_portfolio_projects_signal
  ON portfolio_projects(signal_band, updated_at DESC);
