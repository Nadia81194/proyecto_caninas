import { getMeta, list, create, update, remove } from './api.js';

/* ---------- Utilidades ---------- */
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const humanize = (s) => { s = s.replace(/_/g, ' '); return s[0].toUpperCase() + s.slice(1); };
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const isNum = (c) => ['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision'].includes(c.type);
const money = (n) => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
const toLocal = (d) => { const x = new Date(d); return new Date(x - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };

/* ---------- Iconos (Lucide, trazo) ---------- */
const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
  package: '<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
  table: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M12 3v18"/>',
};
const icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ICONS.table}</svg>`;
const iconFor = (t) => /refac|invent/.test(t) ? 'package' : /cliente/.test(t) ? 'users' : /vehic/.test(t) ? 'car' : /orden/.test(t) ? 'clipboard' : /mecan|servic/.test(t) ? 'wrench' : 'table';

/* ---------- Estado ---------- */
let meta = {};
const S = { t: null, rows: [], q: '', sort: null, dir: 1, page: 1 };
const PER = 10;

const head = (title, sub, actions = '') => {
  $('#title').textContent = title; $('#subtitle').textContent = sub;
  $('#actions').innerHTML = actions; document.title = `${title} · Las Caninas`;
};
const loading = () => '<div class="empty"><div class="spinner"></div><p>Cargando…</p></div>';
const toast = (msg, err) => {
  const t = $('#toast'); t.textContent = msg; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.id); toast.id = setTimeout(() => (t.className = ''), 3500);
};

/* ---------- Formato de celdas ---------- */
const tone = (e) => { e = norm(e); return /listo|entreg|termin|finaliz/.test(e) ? 'ok' : /reparaci|proceso/.test(e) ? 'info' : /diagn|espera|pend|recib|ingres/.test(e) ? 'warn' : /cancel/.test(e) ? 'err' : 'gray'; };
function cell(c, v) {
  if (v == null || v === '') return '<span class="muted">—</span>';
  if (c.type === 'boolean') return `<span class="badge ${v ? 'ok' : 'gray'}">${v ? 'Sí' : 'No'}</span>`;
  if (c.name === 'estado') return `<span class="badge ${tone(v)}">${esc(v)}</span>`;
  if (c.type.includes('timestamp')) return new Date(v).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  if (isNum(c) && /costo|precio|total/.test(c.name)) return money(v);
  if (isNum(c) && !/^id_|anio/.test(c.name)) return Number(v).toLocaleString('es-MX');
  return esc(v);
}

/* ---------- Vista: Resumen ---------- */
const kpi = (ic, label, value, cls = '', href) => {
  const body = `<span class="kpi-ic">${icon(ic)}</span><div><p>${label}</p><strong>${value}</strong></div>`;
  return href ? `<a class="kpi ${cls}" href="${href}">${body}</a>` : `<div class="kpi ${cls}">${body}</div>`;
};
async function showHome() {
  head('Resumen', 'Estado general del taller');
  $('#content').innerHTML = loading();
  const data = Object.fromEntries(await Promise.all(Object.keys(meta).map(async (t) => [t, await list(t)])));
  const ord = data.ordenes_trabajo || [], inv = data.inventario_refacciones || [], key = [];
  if (meta.ordenes_trabajo) {
    key.push(kpi('clipboard', 'Órdenes activas', ord.filter((r) => !/entreg|cancel|finaliz|termin/.test(norm(r.estado))).length, 'info'));
    key.push(kpi('dollar', 'Total en órdenes', money(ord.reduce((s, r) => s + Number(r.costo_total || 0), 0)), 'ok'));
  }
  if (meta.inventario_refacciones) {
    const low = inv.filter((r) => Number(r.stock_actual) <= Number(r.stock_minimo)).length;
    key.push(kpi('alert', 'Refacciones con stock bajo', low, low ? 'warn' : '', '#inventario_refacciones'));
  }
  $('#content').innerHTML =
    (key.length ? `<h2 class="section-title">Indicadores</h2><div class="kpis">${key.join('')}</div>` : '') +
    `<h2 class="section-title">Registros por módulo</h2><div class="kpis">${Object.keys(meta).map((t) => kpi(iconFor(t), humanize(t), data[t].length, '', '#' + t)).join('')}</div>`;
}

/* ---------- Vista: Tabla ---------- */
async function showTable(t) {
  Object.assign(S, { t, q: '', sort: null, dir: 1, page: 1 });
  head(humanize(t), 'Cargando…');
  $('#content').innerHTML = loading();
  S.rows = await list(t);
  head(humanize(t), `${S.rows.length} registros`, `<button class="btn btn-primary" id="new">${icon('plus')}Nuevo registro</button>`);
  $('#content').innerHTML = `<div class="card"><div class="toolbar"><label class="search">${icon('search')}<input id="q" type="search" placeholder="Buscar en ${esc(humanize(t).toLowerCase())}…" aria-label="Buscar"></label></div><div class="table-wrap" id="tbl"></div><div class="pager" id="pager"></div></div>`;
  $('#q').oninput = (e) => { S.q = e.target.value.toLowerCase(); S.page = 1; draw(); };
  $('#new').onclick = () => openForm(null);
  $('#tbl').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.s) { S.dir = S.sort === b.dataset.s ? -S.dir : 1; S.sort = b.dataset.s; draw(); }
    if (b.dataset.e) openForm(S.rows.find((r) => String(r[meta[S.t].pk]) === b.dataset.e));
    if (b.dataset.d) askDelete(b.dataset.d);
  };
  $('#pager').onclick = (e) => { const b = e.target.closest('button'); if (b) { S.page += +b.dataset.p; draw(); } };
  draw();
}
async function reload() {
  S.rows = await list(S.t);
  $('#subtitle').textContent = `${S.rows.length} registros`;
  draw();
}
function draw() {
  const m = meta[S.t];
  let r = S.rows.filter((x) => !S.q || Object.values(x).join(' ').toLowerCase().includes(S.q));
  if (S.sort) {
    const c = m.columns.find((c) => c.name === S.sort);
    r = [...r].sort((a, b) => {
      const x = a[S.sort], y = b[S.sort];
      if (x == null) return 1; if (y == null) return -1;
      return S.dir * (isNum(c) ? x - y : String(x).localeCompare(String(y), 'es'));
    });
  }
  const pages = Math.max(1, Math.ceil(r.length / PER));
  S.page = Math.min(Math.max(S.page, 1), pages);
  const s = (S.page - 1) * PER, v = r.slice(s, s + PER);
  $('#tbl').innerHTML = !v.length
    ? `<div class="empty">${icon('search')}<p>${S.q ? 'Sin resultados para tu búsqueda' : 'Aún no hay registros en este módulo'}</p></div>`
    : `<table><thead><tr>${m.columns.map((c) => `<th class="${isNum(c) ? 'num' : ''}" aria-sort="${S.sort === c.name ? (S.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button data-s="${c.name}">${humanize(c.name)}<span aria-hidden="true">${S.sort === c.name ? (S.dir > 0 ? '↑' : '↓') : ''}</span></button></th>`).join('')}<th><span class="sr">Acciones</span></th></tr></thead><tbody>${v.map((x) => `<tr>${m.columns.map((c) => `<td class="${isNum(c) ? 'num' : ''}">${cell(c, x[c.name])}</td>`).join('')}<td class="act"><button class="btn btn-ghost btn-sm" data-e="${esc(x[m.pk])}">Editar</button><button class="btn btn-ghost btn-sm danger" data-d="${esc(x[m.pk])}">Eliminar</button></td></tr>`).join('')}</tbody></table>`;
  $('#pager').innerHTML = r.length
    ? `<span>${s + 1}–${s + v.length} de ${r.length}</span><div><button class="btn btn-outline btn-sm" data-p="-1" ${S.page <= 1 ? 'disabled' : ''}>Anterior</button><button class="btn btn-outline btn-sm" data-p="1" ${S.page >= pages ? 'disabled' : ''}>Siguiente</button></div>`
    : '';
}

/* ---------- Formulario (crear / editar) ---------- */
const fkLabel = (t, r) => {
  const m = meta[t];
  const txt = m.columns.filter((c) => c.type.includes('char') && c.name !== m.pk).slice(0, 2).map((c) => r[c.name]).filter(Boolean).join(' ');
  return `#${r[m.pk]} · ${txt}`;
};
function field(c, v, fk) {
  const n = `name="${c.name}" id="f_${c.name}"`, rq = c.required ? 'required' : '';
  let h;
  if (fk) {
    const pk = meta[fk[0]].pk;
    h = `<select ${n} ${rq}><option value="">Seleccionar…</option>${fk[1].map((r) => `<option value="${esc(r[pk])}" ${String(v) === String(r[pk]) ? 'selected' : ''}>${esc(fkLabel(fk[0], r))}</option>`).join('')}</select>`;
  } else if (c.type === 'boolean') {
    h = `<select ${n}><option value="">—</option><option value="true" ${v === true ? 'selected' : ''}>Sí</option><option value="false" ${v === false ? 'selected' : ''}>No</option></select>`;
  } else if (c.type === 'text') {
    h = `<textarea ${n} ${rq} rows="3">${esc(v)}</textarea>`;
  } else if (c.type.includes('timestamp')) {
    h = `<input type="datetime-local" ${n} ${rq} value="${v ? toLocal(v) : ''}">`;
  } else if (isNum(c)) {
    h = `<input type="number" step="${/numeric|real|double/.test(c.type) ? 'any' : '1'}" ${n} ${rq} value="${esc(v)}">`;
  } else {
    h = `<input ${n} ${rq} value="${esc(v)}">`;
  }
  return `<div class="field${c.type === 'text' ? ' wide' : ''}"><label for="f_${c.name}">${humanize(c.name)}${c.required ? '<b aria-hidden="true">*</b>' : ''}</label>${h}</div>`;
}
async function openForm(row) {
  const m = meta[S.t], cols = m.columns.filter((c) => c.name !== m.pk), fk = {};
  try {
    await Promise.all(cols.map(async (c) => {
      const ft = Object.keys(meta).find((t) => t !== S.t && meta[t].pk === c.name);
      if (ft) fk[c.name] = [ft, await list(ft)];
    }));
  } catch (e) { return toast(e.message, 1); }
  $('#dlg').innerHTML = `<form id="frm"><header><h2 id="dlgTitle">${row ? 'Editar' : 'Nuevo'} registro</h2><p>${esc(humanize(S.t))}${row ? ` · #${esc(row[m.pk])}` : ''}</p></header><div class="grid">${cols.map((c) => field(c, row?.[c.name], fk[c.name])).join('')}</div><footer><button type="button" class="btn btn-outline" id="cx">Cancelar</button><button class="btn btn-primary">Guardar</button></footer></form>`;
  $('#cx').onclick = () => $('#dlg').close();
  $('#frm').onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      row ? await update(S.t, row[m.pk], data) : await create(S.t, data);
      $('#dlg').close(); toast('Registro guardado'); reload();
    } catch (er) { toast(er.message, 1); }
  };
  $('#dlg').showModal();
}

/* ---------- Confirmación de borrado ---------- */
function askDelete(id) {
  const d = $('#cfm');
  d.innerHTML = `<form method="dialog"><header><h2>¿Eliminar registro?</h2><p>Se eliminará el registro #${esc(id)} de ${esc(humanize(S.t).toLowerCase())}. Esta acción no se puede deshacer.</p></header><footer><button class="btn btn-outline" value="no">Cancelar</button><button class="btn btn-danger" value="yes">Eliminar</button></footer></form>`;
  d.returnValue = '';
  d.onclose = async () => {
    if (d.returnValue !== 'yes') return;
    try { await remove(S.t, id); toast('Registro eliminado'); reload(); }
    catch (e) { toast(/foreign key/i.test(e.message) ? 'No se puede eliminar: tiene registros relacionados.' : e.message, 1); }
  };
  d.showModal();
}

/* ---------- Navegación ---------- */
async function route() {
  const t = location.hash.slice(1);
  $('#sidebar').classList.remove('open');
  document.querySelectorAll('#menu a').forEach((a) => {
    const on = a.getAttribute('href') === '#' + (meta[t] ? t : 'resumen');
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  try { meta[t] ? await showTable(t) : await showHome(); }
  catch (e) { $('#content').innerHTML = `<div class="empty"><p><b>Ocurrió un error</b></p><p>${esc(e.message)}</p></div>`; }
  $('#content').focus({ preventScroll: true });
}

async function init() {
  $('#menuBtn').innerHTML = icon('menu');
  $('#menuBtn').onclick = () => $('#sidebar').classList.toggle('open');
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  try { meta = await getMeta(); }
  catch {
    head('Sin conexión', '');
    $('#content').innerHTML = '<div class="empty"><p><b>No se pudo conectar con el servidor.</b></p><p>Verifica que <code>npm start</code> esté corriendo y que tu archivo <code>.env</code> tenga la contraseña correcta.</p></div>';
    return;
  }
  $('#menu').innerHTML = `<p class="group">General</p><a href="#resumen">${icon('home')}Resumen</a><p class="group">Módulos</p>` +
    Object.keys(meta).map((t) => `<a href="#${t}">${icon(iconFor(t))}${esc(humanize(t))}</a>`).join('');
  addEventListener('hashchange', route);
  route();
}
init();
