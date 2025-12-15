-- Unchained Engine: Core Assortments Schema
-- SQLite schema for assortments module
--
-- Design: Document-oriented with JSON storage + virtual generated columns for indexed access
-- All entity data is stored in a `data` JSON column, with virtual columns extracting
-- frequently queried fields for indexing. This provides schema flexibility while
-- maintaining query performance.

-- Assortments: Main catalog/category entities
CREATE TABLE IF NOT EXISTS assortments (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access (computed from JSON, not stored)
  is_active INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.isActive'), 1)) VIRTUAL,
  is_base INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.isBase'), 0)) VIRTUAL,
  is_root INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.isRoot'), 0)) VIRTUAL,
  sequence INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.sequence'), 0)) VIRTUAL,
  slugs TEXT GENERATED ALWAYS AS (json_extract(data, '$.slugs')) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL,
  deleted TEXT GENERATED ALWAYS AS (json_extract(data, '$.deleted')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortments_is_active ON assortments(is_active);
CREATE INDEX IF NOT EXISTS idx_assortments_is_root ON assortments(is_root);
CREATE INDEX IF NOT EXISTS idx_assortments_sequence ON assortments(sequence);
CREATE INDEX IF NOT EXISTS idx_assortments_deleted ON assortments(deleted);

-- Assortment Texts: Localized content for assortments
CREATE TABLE IF NOT EXISTS assortment_texts (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.assortmentId')) VIRTUAL,
  locale TEXT GENERATED ALWAYS AS (json_extract(data, '$.locale')) VIRTUAL,
  slug TEXT GENERATED ALWAYS AS (json_extract(data, '$.slug')) VIRTUAL,
  title TEXT GENERATED ALWAYS AS (json_extract(data, '$.title')) VIRTUAL,
  subtitle TEXT GENERATED ALWAYS AS (json_extract(data, '$.subtitle')) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_texts_assortment_id ON assortment_texts(assortment_id);
CREATE INDEX IF NOT EXISTS idx_assortment_texts_locale ON assortment_texts(locale);
CREATE INDEX IF NOT EXISTS idx_assortment_texts_slug ON assortment_texts(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_texts_locale_assortment ON assortment_texts(locale, assortment_id);

-- Assortment Products: Links between assortments and products
CREATE TABLE IF NOT EXISTS assortment_products (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.assortmentId')) VIRTUAL,
  product_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.productId')) VIRTUAL,
  sort_key INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.sortKey'), 0)) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_products_assortment_id ON assortment_products(assortment_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_assortment_products_product_id ON assortment_products(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_products_unique ON assortment_products(assortment_id, product_id);

-- Assortment Links: Parent-child relationships between assortments
CREATE TABLE IF NOT EXISTS assortment_links (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  parent_assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.parentAssortmentId')) VIRTUAL,
  child_assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.childAssortmentId')) VIRTUAL,
  sort_key INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.sortKey'), 0)) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_links_parent ON assortment_links(parent_assortment_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_assortment_links_child ON assortment_links(child_assortment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_links_unique ON assortment_links(parent_assortment_id, child_assortment_id);

-- Assortment Filters: Links between assortments and filters
CREATE TABLE IF NOT EXISTS assortment_filters (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.assortmentId')) VIRTUAL,
  filter_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.filterId')) VIRTUAL,
  sort_key INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.sortKey'), 0)) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_filters_assortment_id ON assortment_filters(assortment_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_assortment_filters_filter_id ON assortment_filters(filter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_filters_unique ON assortment_filters(assortment_id, filter_id);

-- Assortment Media: Links between assortments and media files
CREATE TABLE IF NOT EXISTS assortment_media (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  assortment_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.assortmentId')) VIRTUAL,
  media_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.mediaId')) VIRTUAL,
  sort_key INTEGER GENERATED ALWAYS AS (IFNULL(json_extract(data, '$.sortKey'), 0)) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_media_assortment_id ON assortment_media(assortment_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_assortment_media_media_id ON assortment_media(media_id);

-- Assortment Media Texts: Localized content for assortment media
CREATE TABLE IF NOT EXISTS assortment_media_texts (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  -- Virtual columns for indexed access
  assortment_media_id TEXT GENERATED ALWAYS AS (json_extract(data, '$.assortmentMediaId')) VIRTUAL,
  locale TEXT GENERATED ALWAYS AS (json_extract(data, '$.locale')) VIRTUAL,
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

CREATE INDEX IF NOT EXISTS idx_assortment_media_texts_media_id ON assortment_media_texts(assortment_media_id);
CREATE INDEX IF NOT EXISTS idx_assortment_media_texts_locale ON assortment_media_texts(locale);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assortment_media_texts_unique ON assortment_media_texts(assortment_media_id, locale);

-- Assortment Product ID Cache: Cached product IDs for performance
CREATE TABLE IF NOT EXISTS assortment_product_id_cache (
  _id TEXT PRIMARY KEY,
  data JSON NOT NULL DEFAULT '{}',
  created TEXT GENERATED ALWAYS AS (json_extract(data, '$.created')) VIRTUAL,
  updated TEXT GENERATED ALWAYS AS (json_extract(data, '$.updated')) VIRTUAL
);

-- Full-text search virtual tables
CREATE VIRTUAL TABLE IF NOT EXISTS assortments_fts USING fts5(
  _id,
  slugs,
  content='assortments',
  content_rowid='rowid'
);

CREATE VIRTUAL TABLE IF NOT EXISTS assortment_texts_fts USING fts5(
  assortment_id,
  title,
  subtitle,
  content='assortment_texts',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS assortments_ai AFTER INSERT ON assortments BEGIN
  INSERT INTO assortments_fts(rowid, _id, slugs)
  VALUES (NEW.rowid, NEW._id, json_extract(NEW.data, '$.slugs'));
END;

CREATE TRIGGER IF NOT EXISTS assortments_ad AFTER DELETE ON assortments BEGIN
  INSERT INTO assortments_fts(assortments_fts, rowid, _id, slugs)
  VALUES('delete', OLD.rowid, OLD._id, json_extract(OLD.data, '$.slugs'));
END;

CREATE TRIGGER IF NOT EXISTS assortments_au AFTER UPDATE ON assortments BEGIN
  INSERT INTO assortments_fts(assortments_fts, rowid, _id, slugs)
  VALUES('delete', OLD.rowid, OLD._id, json_extract(OLD.data, '$.slugs'));
  INSERT INTO assortments_fts(rowid, _id, slugs)
  VALUES (NEW.rowid, NEW._id, json_extract(NEW.data, '$.slugs'));
END;

CREATE TRIGGER IF NOT EXISTS assortment_texts_ai AFTER INSERT ON assortment_texts BEGIN
  INSERT INTO assortment_texts_fts(rowid, assortment_id, title, subtitle)
  VALUES (NEW.rowid, json_extract(NEW.data, '$.assortmentId'), json_extract(NEW.data, '$.title'), json_extract(NEW.data, '$.subtitle'));
END;

CREATE TRIGGER IF NOT EXISTS assortment_texts_ad AFTER DELETE ON assortment_texts BEGIN
  INSERT INTO assortment_texts_fts(assortment_texts_fts, rowid, assortment_id, title, subtitle)
  VALUES('delete', OLD.rowid, json_extract(OLD.data, '$.assortmentId'), json_extract(OLD.data, '$.title'), json_extract(OLD.data, '$.subtitle'));
END;

CREATE TRIGGER IF NOT EXISTS assortment_texts_au AFTER UPDATE ON assortment_texts BEGIN
  INSERT INTO assortment_texts_fts(assortment_texts_fts, rowid, assortment_id, title, subtitle)
  VALUES('delete', OLD.rowid, json_extract(OLD.data, '$.assortmentId'), json_extract(OLD.data, '$.title'), json_extract(OLD.data, '$.subtitle'));
  INSERT INTO assortment_texts_fts(rowid, assortment_id, title, subtitle)
  VALUES (NEW.rowid, json_extract(NEW.data, '$.assortmentId'), json_extract(NEW.data, '$.title'), json_extract(NEW.data, '$.subtitle'));
END;
