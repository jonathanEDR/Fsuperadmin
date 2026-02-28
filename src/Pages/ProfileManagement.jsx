import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Edit2, Save, X, Search, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, Shield, User, Crown, Check, Loader2 } from 'lucide-react';

// ---- Avatar reutilizable ----
const AvatarColab = ({ nombre, avatar, avatarUrl, size = 'md' }) => {
  const src = avatarUrl || (avatar ? (typeof avatar === 'string' ? avatar : avatar?.url) : null);
  const [err, setErr] = React.useState(false);
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (src && !err) {
    return <img src={src} alt={nombre} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white shadow-sm`} onError={() => setErr(true)} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm`}>
      {(nombre || '?').charAt(0).toUpperCase()}
    </div>
  );
};

// ---- Badge de departamento ----
const BadgeDept = ({ dept, options }) => {
  const colors = {
    ventas: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    administracion: 'text-blue-700 bg-blue-50 border-blue-100',
    produccion: 'text-orange-700 bg-orange-50 border-orange-100',
    finanzas: 'text-purple-700 bg-purple-50 border-purple-100',
  };
  const label = options.find(d => d.value === dept)?.label || dept || 'No asignado';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[dept] || 'text-gray-600 bg-gray-50 border-gray-100'}`}>
      {label}
    </span>
  );
};

// ---- Badge de rol ----
const BadgeRol = ({ role }) => {
  const styles = {
    super_admin: 'text-purple-700 bg-purple-50 border-purple-200',
    admin: 'text-blue-700 bg-blue-50 border-blue-200',
    user: 'text-gray-600 bg-gray-50 border-gray-200',
    de_baja: 'text-red-500 bg-red-50 border-red-100',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[role] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
      {role}
    </span>
  );
};

const ProfileManagement = ({ userRole }) => {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_users: 0, per_page: 15 });
  const LIMIT = 15;

  const [roleModal, setRoleModal] = useState({ isOpen: false, user: null, newRole: '' });

  const [editForm, setEditForm] = useState({
    nombre_negocio: '',
    email: '',
    departamento: 'ventas',
    sueldo: 0
  });

  const departamentoOptions = [
    { value: 'ventas', label: 'Ventas' },
    { value: 'administracion', label: 'Administracion' },
    { value: 'produccion', label: 'Produccion' },
    { value: 'finanzas', label: 'Finanzas' }
  ];

  const roleOptions = [
    { value: 'user', label: 'Usuario', icon: User, color: 'bg-gray-100 text-gray-700', description: 'Acceso basico al sistema' },
    { value: 'admin', label: 'Administrador', icon: Shield, color: 'bg-blue-100 text-blue-700', description: 'Gestion de usuarios y ventas' },
    { value: 'super_admin', label: 'Super Admin', icon: Crown, color: 'bg-purple-100 text-purple-700', description: 'Acceso total al sistema' },
    { value: 'de_baja', label: 'De Baja', icon: X, color: 'bg-red-100 text-red-600', description: 'Sin acceso al sistema' },
  ];

  const canEditUser = (targetUser) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin') return targetUser.role === 'user';
    return false;
  };

  const canEditSueldo = (targetUser) => {
    if (userRole === 'super_admin') return true;
    if (userRole === 'admin' && targetUser.role === 'user') return true;
    return false;
  };

  const formatearMoneda = (amount) => {
    if (!amount && amount !== 0) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0).replace('PEN', 'S/');
  };

  const validateForm = () => {
    const errors = [];
    if (!editForm.email || !editForm.email.includes('@')) errors.push('Email valido requerido');
    if (!editForm.nombre_negocio || editForm.nombre_negocio.trim().length < 2) errors.push('Nombre debe tener al menos 2 caracteres');
    if (editForm.sueldo && editForm.sueldo.trim() !== '') {
      const n = parseFloat(editForm.sueldo);
      if (isNaN(n) || n < 0) errors.push('Sueldo debe ser un numero valido mayor a 0');
    }
    return errors;
  };

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() });
      if (searchTerm) params.set('search', searchTerm);
      const url = `${backendUrl}/api/admin/users-profiles?${params}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        if (data.pagination) setPagination(data.pagination);
        setError('');
      } else {
        const e = await response.json();
        throw new Error(e.message || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    if (!canEditUser(user)) { setError('Sin permisos para editar este usuario'); return; }
    setEditingUser(user);
    setEditForm({ nombre_negocio: user.nombre_negocio || '', email: user.email, departamento: user.departamento || 'ventas', sueldo: user.sueldo ? user.sueldo.toString() : '' });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ nombre_negocio: '', email: '', departamento: 'ventas', sueldo: '' });
  };

  const handleSaveProfile = async (userId) => {
    const errs = validateForm();
    if (errs.length > 0) { setError(errs.join(', ')); return; }
    try {
      const token = await getToken();
      const dataToSend = { nombre_negocio: editForm.nombre_negocio.trim(), email: editForm.email.trim(), departamento: editForm.departamento };
      const targetUser = users.find(u => u._id === userId);
      if (canEditSueldo(targetUser)) {
        dataToSend.sueldo = editForm.sueldo === '' ? 0 : parseFloat(editForm.sueldo) || 0;
      }
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/update-profile/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (response.ok) {
        const result = await response.json();
        setEditingUser(null);
        fetchUsers();
        setError('success:' + result.message);
      } else {
        const e = await response.json();
        throw new Error(e.message || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error al actualizar: ' + err.message);
    }
  };

  const openRoleModal = (user) => setRoleModal({ isOpen: true, user, newRole: user.role });
  const closeRoleModal = () => setRoleModal({ isOpen: false, user: null, newRole: '' });

  const handleChangeRole = async () => {
    if (!roleModal.user || !roleModal.newRole || roleModal.newRole === roleModal.user.role) { closeRoleModal(); return; }
    try {
      const token = await getToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/admin/users/${roleModal.user._id}/role`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleModal.newRole })
      });
      if (response.ok) {
        fetchUsers();
        setError(`success:Rol cambiado a ${roleOptions.find(r => r.value === roleModal.newRole)?.label || roleModal.newRole}`);
        closeRoleModal();
      } else {
        const e = await response.json();
        throw new Error(e.message || 'Error al cambiar rol');
      }
    } catch (err) {
      setError('Error al cambiar rol: ' + err.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (page === 1) fetchUsers();
    else setPage(1);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-800">Gestion de Perfiles</h3>
              <p className="text-xs text-gray-400 mt-0.5">{pagination.total_users} usuario{pagination.total_users !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-2">
              <form onSubmit={handleSearch} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all w-44"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all">
                  <Search size={14} strokeWidth={2.5} />
                </button>
              </form>
              <button onClick={fetchUsers} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-all">
                <RefreshCw size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alerta */}
        {error && (
          <div className={`mx-5 mt-4 px-4 py-3 rounded-xl text-sm border ${
            error.startsWith('success:')
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {error.startsWith('success:') ? error.replace('success:', '') : error}
          </div>
        )}

        {/* Vista Desktop - tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sueldo</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user._id} className={`transition-colors ${!canEditUser(user) ? 'opacity-60' : 'hover:bg-slate-50/40'}`}>
                  {/* Avatar */}
                  <td className="pl-5 py-3 pr-1">
                    <AvatarColab nombre={user.nombre_negocio || user.email} avatar={user.avatar} avatarUrl={user.avatar_url} />
                  </td>

                  {/* Nombre + Email */}
                  <td className="px-3 py-3">
                    {editingUser?._id === user._id ? (
                      <div className="space-y-1.5">
                        <input type="text" className={inputCls} value={editForm.nombre_negocio} onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })} placeholder="Nombre" />
                        <input type="email" className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-gray-800">{user.nombre_negocio || '-'}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{user.email}</div>
                      </div>
                    )}
                  </td>

                  {/* Departamento */}
                  <td className="px-3 py-3">
                    {editingUser?._id === user._id ? (
                      <select className={inputCls} value={editForm.departamento} onChange={(e) => setEditForm({ ...editForm, departamento: e.target.value })}>
                        {departamentoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <BadgeDept dept={user.departamento} options={departamentoOptions} />
                    )}
                  </td>

                  {/* Sueldo */}
                  <td className="px-3 py-3 text-right">
                    {editingUser?._id === user._id ? (
                      <input type="text" className={`${inputCls} text-right w-28`} value={editForm.sueldo}
                        onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setEditForm({ ...editForm, sueldo: v }); }}
                        placeholder="0.00" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-700">
                        {canEditSueldo(user) ? formatearMoneda(user.sueldo) : <span className="text-gray-300 tracking-widest"></span>}
                      </span>
                    )}
                  </td>

                  {/* Rol */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => userRole === 'super_admin' && user.role !== 'super_admin' ? openRoleModal(user) : null}
                      disabled={userRole !== 'super_admin' || user.role === 'super_admin'}
                      className={`inline-flex items-center gap-1 ${userRole === 'super_admin' && user.role !== 'super_admin' ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 rounded-full' : 'cursor-default'}`}
                    >
                      <BadgeRol role={user.role} />
                      {userRole === 'super_admin' && user.role !== 'super_admin' && <ChevronDown size={11} className="text-gray-400" />}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-3 py-3 text-center">
                    {editingUser?._id === user._id ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleSaveProfile(user._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-all">
                          <Save size={13} strokeWidth={2.5} /> Guardar
                        </button>
                        <button onClick={handleCancelEdit}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                          <X size={15} strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      (canEditUser(user)) && (
                        <button onClick={() => handleEdit(user)}
                          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <Edit2 size={15} strokeWidth={2} />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400 italic">No se encontraron usuarios</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Movil - tarjetas */}
        <div className="md:hidden p-3 space-y-3">
          {users.map((user) => (
            <div key={user._id} className={`bg-white rounded-xl p-4 border shadow-sm transition-all ${!canEditUser(user) ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:shadow-md'}`}>
              {editingUser?._id === user._id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                    <input type="text" className={inputCls} value={editForm.nombre_negocio} onChange={(e) => setEditForm({ ...editForm, nombre_negocio: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Departamento</label>
                      <select className={inputCls} value={editForm.departamento} onChange={(e) => setEditForm({ ...editForm, departamento: e.target.value })}>
                        {departamentoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sueldo</label>
                      <input type="text" className={inputCls} value={editForm.sueldo}
                        onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setEditForm({ ...editForm, sueldo: v }); }}
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleSaveProfile(user._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-all">
                      <Save size={14} strokeWidth={2.5} /> Guardar
                    </button>
                    <button onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg border text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-all">
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <AvatarColab nombre={user.nombre_negocio || user.email} avatar={user.avatar} avatarUrl={user.avatar_url} />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate text-sm">{user.nombre_negocio || 'Sin nombre'}</h4>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => userRole === 'super_admin' && user.role !== 'super_admin' ? openRoleModal(user) : null}
                      disabled={userRole !== 'super_admin' || user.role === 'super_admin'}
                      className={`flex-shrink-0 flex items-center gap-1 ${userRole === 'super_admin' && user.role !== 'super_admin' ? 'cursor-pointer' : 'cursor-default'}`}>
                      <BadgeRol role={user.role} />
                      {userRole === 'super_admin' && user.role !== 'super_admin' && <ChevronDown size={10} className="text-gray-400" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Departamento</span>
                      <BadgeDept dept={user.departamento} options={departamentoOptions} />
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide block mb-0.5">Sueldo</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {canEditSueldo(user) ? formatearMoneda(user.sueldo) : <span className="text-gray-300 tracking-widest"></span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                    {canEditUser(user) && (
                      <button onClick={() => handleEdit(user)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 transition-all">
                        <Edit2 size={13} strokeWidth={2.5} /> Editar
                      </button>
                    )}
                    {userRole === 'super_admin' && user.role !== 'super_admin' && (
                      <button onClick={() => openRoleModal(user)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg border text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 transition-all">
                        <Shield size={13} strokeWidth={2.5} /> Cambiar Rol
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-400 italic">No se encontraron usuarios</div>
          )}
        </div>

        {/* Paginacion */}
        {pagination.total_pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              Mostrando {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, pagination.total_users)} de {pagination.total_users}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                        p === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'border border-gray-200 text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                    >{p}</button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                disabled={page >= pagination.total_pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Cambiar Rol */}
      {roleModal.isOpen && roleModal.user && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-purple-500 to-indigo-600">
              <div className="flex items-center gap-3">
                <AvatarColab nombre={roleModal.user.nombre_negocio || roleModal.user.email} avatar={roleModal.user.avatar} avatarUrl={roleModal.user.avatar_url} size="sm" />
                <div>
                  <h3 className="text-base font-bold text-white">Cambiar Rol</h3>
                  <p className="text-purple-200 text-xs">{roleModal.user.nombre_negocio || roleModal.user.email}</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-3">Selecciona el nuevo rol para este usuario:</p>
              <div className="space-y-2">
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = roleModal.newRole === role.value;
                  const isCurrent = roleModal.user.role === role.value;
                  return (
                    <button key={role.value} onClick={() => setRoleModal(p => ({ ...p, newRole: role.value }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${role.color}`}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{role.label}</span>
                          {isCurrent && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Actual</span>}
                        </div>
                        <p className="text-xs text-gray-400">{role.description}</p>
                      </div>
                      {isSelected && <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"><Check size={11} className="text-white" strokeWidth={3} /></div>}
                    </button>
                  );
                })}
              </div>
              {roleModal.user.role === 'admin' && roleModal.newRole === 'user' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  Este usuario perdera sus privilegios de administrador.
                </div>
              )}
              {roleModal.newRole === 'super_admin' && roleModal.user.role !== 'super_admin' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                  Este usuario tendra acceso total al sistema.
                </div>
              )}
            </div>
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex gap-2 justify-end">
              <button onClick={closeRoleModal} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
              <button onClick={handleChangeRole} disabled={roleModal.newRole === roleModal.user.role}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileManagement;