// Capa de acceso a datos: todo el contacto con el servidor vive aquí.
async function request(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Error de conexión con el servidor');
  return json;
}

export const getMeta = () => request('/api/meta');
export const list = (t) => request(`/api/${t}`);
export const create = (t, data) => request(`/api/${t}`, 'POST', data);
export const update = (t, id, data) => request(`/api/${t}/${id}`, 'PUT', data);
export const remove = (t, id) => request(`/api/${t}/${id}`, 'DELETE');
