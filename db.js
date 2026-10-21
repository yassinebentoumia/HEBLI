// ============================================================
// HEBLI – PostgreSQL persistence adapter (Phase 1)
//
// Data is stored as individual records per collection instead of a
// local data.json file. The server still rebuilds the same /api/state
// snapshot so the existing Vite client keeps working unchanged.
//
// Requires: npm install pg
// Env: DATABASE_URL=postgresql://...?sslmode=require
// ============================================================

import pg from 'pg';

const { Pool } = pg;

// Same synced array keys used by src/utils/sync.ts.
export const COLLECTIONS = [
  'hebli_products',
  'hebli_orders',
  'hebli_staff',
  'hebli_payments',
  'hebli_inventory',
  'hebli_inventory_transactions',
  'hebli_audit_logs',
  'hebli_categories',
  'hebli_chat_messages',
  'hebli_tickets',
  'hebli_staff_sessions',
  'hebli_notifications',
  'hebli_suppliers',
  'hebli_invoices',
  'hebli_consumptions',
  'hebli_loyalty',
  'hebli_settings',
];

export const TOMBSTONE_KEY = 'hebli_tombstones';

/**
 * PostgreSQL persistence. Collections are normalized to one row per entity:
 *   hebli_records(collection, record_id, data JSONB, timestamps)
 * This avoids a giant ever-growing JSON file and leaves an easy path to fully
 * relational tables/API endpoints in Phase 2.
 */
export class PostgresStateStore {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
      // Render app has a small number of writes; don't open a huge connection pool.
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 8_000,
      // Never let a stuck/slow database query freeze the café checkout forever.
      query_timeout: 8_000,
      statement_timeout: 8_000,
    });
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS hebli_records (
        collection TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (collection, record_id)
      );
      CREATE INDEX IF NOT EXISTS hebli_records_collection_idx
        ON hebli_records (collection, updated_at DESC);

      CREATE TABLE IF NOT EXISTS hebli_tombstones (
        collection TEXT NOT NULL,
        record_id TEXT NOT NULL,
        deleted_at BIGINT NOT NULL,
        PRIMARY KEY (collection, record_id)
      );
      CREATE INDEX IF NOT EXISTS hebli_tombstones_deleted_idx
        ON hebli_tombstones (deleted_at);

      CREATE TABLE IF NOT EXISTS hebli_meta (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async isEmpty() {
    const result = await this.pool.query('SELECT EXISTS (SELECT 1 FROM hebli_records LIMIT 1) AS exists');
    return !result.rows[0].exists;
  }

  // Rebuild the legacy state snapshot consumed by the existing client sync.
  async loadState() {
    const state = { _updatedAt: 0 };
    COLLECTIONS.forEach((key) => { state[key] = []; });
    state[TOMBSTONE_KEY] = [];

    const [records, tombstones, meta] = await Promise.all([
      this.pool.query('SELECT collection, data FROM hebli_records ORDER BY created_at ASC'),
      this.pool.query('SELECT collection, record_id, deleted_at FROM hebli_tombstones ORDER BY deleted_at ASC'),
      this.pool.query('SELECT key, value, EXTRACT(EPOCH FROM updated_at) * 1000 AS updated_ms FROM hebli_meta'),
    ]);

    for (const row of records.rows) {
      if (!state[row.collection]) state[row.collection] = [];
      state[row.collection].push(row.data);
    }
    state[TOMBSTONE_KEY] = tombstones.rows.map((t) => ({
      key: t.collection,
      id: t.record_id,
      deletedAt: Number(t.deleted_at),
    }));

    for (const row of meta.rows) {
      state[row.key] = row.value;
      state._updatedAt = Math.max(state._updatedAt, Number(row.updated_ms || 0));
    }
    return state;
  }

  /** Save the canonical in-memory state in one transaction. */
  async saveState(state) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Save each collection as independent entity rows. This scales much better
      // than writing the entire café state into one JSON document.
      for (const collection of COLLECTIONS) {
        const items = Array.isArray(state[collection]) ? state[collection] : [];
        const ids = [];
        for (const item of items) {
          if (!item || typeof item !== 'object' || item.id === undefined || item.id === null) continue;
          const id = String(item.id);
          ids.push(id);
          await client.query(
            `INSERT INTO hebli_records (collection, record_id, data, created_at, updated_at)
             VALUES ($1, $2, $3::jsonb, NOW(), NOW())
             ON CONFLICT (collection, record_id)
             DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
            [collection, id, JSON.stringify(item)],
          );
        }
        // The canonical server snapshot is authoritative: remove records no longer
        // in this collection. Deletes remain auditable in hebli_tombstones.
        if (ids.length) {
          await client.query(
            'DELETE FROM hebli_records WHERE collection = $1 AND NOT (record_id = ANY($2::text[]))',
            [collection, ids],
          );
        } else {
          await client.query('DELETE FROM hebli_records WHERE collection = $1', [collection]);
        }
      }

      // Replace active tombstones and prune ones older than 30 days.
      await client.query('DELETE FROM hebli_tombstones');
      const tombstones = Array.isArray(state[TOMBSTONE_KEY]) ? state[TOMBSTONE_KEY] : [];
      for (const tomb of tombstones) {
        if (!tomb?.key || tomb.id === undefined || !tomb.deletedAt) continue;
        await client.query(
          `INSERT INTO hebli_tombstones (collection, record_id, deleted_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (collection, record_id) DO UPDATE SET deleted_at = EXCLUDED.deleted_at`,
          [String(tomb.key), String(tomb.id), Number(tomb.deletedAt)],
        );
      }

      // Server-only metadata (Wi-Fi lock etc.), not client collection arrays.
      const metaKeys = Object.keys(state).filter(
        (key) => key !== '_updatedAt' && key !== TOMBSTONE_KEY && !COLLECTIONS.includes(key),
      );
      for (const key of metaKeys) {
        await client.query(
          `INSERT INTO hebli_meta (key, value, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, JSON.stringify(state[key])],
        );
      }
      await client.query(
        `INSERT INTO hebli_meta (key, value, updated_at)
         VALUES ('_updatedAt', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(state._updatedAt || Date.now())],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Phase 2 fast path: persist only records changed by a REST mutation.
   * Unlike saveState(), this never rewrites all historical audit logs/products/
   * invoices on every order. This is what keeps checkout fast at real café scale.
   */
  async saveRecords(records, updatedAt, meta = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const record of records) {
        if (!record?.collection || !record?.data?.id) continue;
        await client.query(
          `INSERT INTO hebli_records (collection, record_id, data, created_at, updated_at)
           VALUES ($1, $2, $3::jsonb, NOW(), NOW())
           ON CONFLICT (collection, record_id)
           DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
          [record.collection, String(record.data.id), JSON.stringify(record.data)],
        );
      }
      await client.query(
        `INSERT INTO hebli_meta (key, value, updated_at)
         VALUES ('_updatedAt', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(updatedAt)],
      );
      for (const [key, value] of Object.entries(meta)) {
        await client.query(
          `INSERT INTO hebli_meta (key, value, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, JSON.stringify(value)],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}
