import { useEffect, useState, useCallback } from 'react';
import client from '../api/client';
import Modal from '../components/ui/Modal';
import { formatDate } from '../utils/formatters';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'operator' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get('/users');
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await client.put(`/users/${editing.id}`, { name: form.name, role: form.role });
      } else {
        await client.post('/users', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    const action = user.active ? 'deactivate' : 'activate';
    const label = user.active ? 'desactivar' : 'activar';
    if (!confirm(`¿Desea ${label} al usuario "${user.name}"?`)) return;
    try {
      await client.patch(`/users/${user.id}/${action}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="page-title">Gestión de Usuarios</h2>
        <button onClick={openCreate} className="btn-primary" id="btn-new-user">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={!u.active ? 'opacity-50' : ''}>
                    <td className="font-medium text-on-surface">{u.name}</td>
                    <td className="text-on-surface-variant text-sm">{u.email}</td>
                    <td>
                      <span className={u.role === 'admin' ? 'badge badge-blue' : 'badge badge-slate'}>
                        {u.role === 'admin' ? 'Administrador' : 'Operador'}
                      </span>
                    </td>
                    <td>
                      <span className={u.active ? 'badge badge-green' : 'badge badge-red'}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-on-surface-variant text-xs">{formatDate(u.created_at)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-primary-fixed text-primary-container transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.active
                              ? 'hover:bg-error-container text-error'
                              : 'hover:bg-tertiary-fixed text-tertiary'
                          }`}
                          title={u.active ? 'Desactivar' : 'Activar'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {u.active ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSave} className="space-y-4" id="user-form">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Nombre *</label>
            <input
              type="text"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="Nombre completo"
            />
          </div>
          {!editing && (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Email *</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
                placeholder="usuario@taita.com.py"
              />
            </div>
          )}
          {!editing && (
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Contraseña *</label>
              <input
                type="password"
                className="form-input"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Rol *</label>
            <select
              className="form-input"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              required
            >
              <option value="operator">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-error-container border border-error-outline text-sm text-error">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary" id="btn-save-user">
              {saving ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
