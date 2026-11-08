require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let meta = {};

async function loadMeta() {
  const c = await pool.query(`select table_name, column_name, data_type, is_nullable, column_default, is_identity
    from information_schema.columns where table_schema='public' order by table_name, ordinal_position`);
  const k = await pool.query(`select kcu.table_name, kcu.column_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name=kcu.constraint_name and tc.table_schema=kcu.table_schema
    where tc.constraint_type='PRIMARY KEY' and tc.table_schema='public'`);
  const pks = {};
  k.rows.forEach(r => (pks[r.table_name] = r.column_name));
  meta = {};
  c.rows.forEach(r => {
    meta[r.table_name] ??= { pk: pks[r.table_name], columns: [] };
    meta[r.table_name].columns.push({
      name: r.column_name,
      type: r.data_type,
      required: r.is_nullable === 'NO' && !r.column_default && r.is_identity !== 'YES',
      auto: !!r.column_default || r.is_identity === 'YES',
    });
  });
  Object.values(meta).forEach(m => (m.pk ||= m.columns[0].name));
}

const T = (req, res, next) => {
  const m = meta[req.params.t];
  if (!m) return res.status(404).json({ error: 'Tabla no existe' });
  req.m = m;
  next();
};
const clean = (m, body) => {
  const names = m.columns.map(c => c.name);
  return Object.entries(body).filter(([k]) => names.includes(k) && k !== m.pk)
    .map(([k, v]) => [k, v === '' ? null : v]);
};
const wrap = fn => async (req, res) => {
  try { res.json(await fn(req)); } catch (e) { res.status(400).json({ error: e.message }); }
};

app.get('/api/meta', (req, res) => res.json(meta));

app.get('/api/:t', T, wrap(async req => {
  const r = await pool.query(`select * from "${req.params.t}" order by "${req.m.pk}" desc limit 500`);
  return r.rows;
}));

app.post('/api/:t', T, wrap(async req => {
  const f = clean(req.m, req.body);
  const sql = f.length
    ? `insert into "${req.params.t}" (${f.map(([k]) => `"${k}"`).join(',')}) values (${f.map((_, i) => '$' + (i + 1)).join(',')}) returning *`
    : `insert into "${req.params.t}" default values returning *`;
  return (await pool.query(sql, f.map(([, v]) => v))).rows[0];
}));

app.put('/api/:t/:id', T, wrap(async req => {
  const f = clean(req.m, req.body);
  if (!f.length) return {};
  const sql = `update "${req.params.t}" set ${f.map(([k], i) => `"${k}"=$${i + 1}`).join(',')} where "${req.m.pk}"=$${f.length + 1} returning *`;
  return (await pool.query(sql, [...f.map(([, v]) => v), req.params.id])).rows[0];
}));

app.delete('/api/:t/:id', T, wrap(async req => {
  await pool.query(`delete from "${req.params.t}" where "${req.m.pk}"=$1`, [req.params.id]);
  return { ok: true };
}));

const PORT = process.env.PORT || 3000;
loadMeta()
  .then(() => app.listen(PORT, () => console.log(`✅ Conectado a Supabase. Abre http://localhost:${PORT}`)))
  .catch(e => { console.error('❌ No se pudo conectar:', e.message); process.exit(1); });
