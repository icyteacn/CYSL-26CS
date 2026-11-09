-- 单文档表：与 KV 方案同语义，全量 JSON 存一行
CREATE TABLE IF NOT EXISTS state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  doc TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
INSERT OR IGNORE INTO state (id, doc, updated_at)
VALUES (1, '{}', datetime('now'));

-- 可选：结构化留痕表（要做 SQL 统计时启用，配合 worker 里 /records 路由自行扩展）
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY,
  title TEXT, type TEXT, date INTEGER, location TEXT,
  attendees INTEGER, photos INTEGER, signin INTEGER, minutes INTEGER,
  synced INTEGER, archived INTEGER, summary TEXT
);
