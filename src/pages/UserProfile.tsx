import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Plus, Trash } from 'lucide-react';

interface UserProfile {
  company_name: string;
  tax_id: string;
  brand_name: string;
  legal_address: string;
  warehouse_address: string;
  phone: string;
  email: string;
}

interface Representative {
  id: string;
  name: string;
  position: string;
  include_in_djc: boolean;
}

function UserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRepresentatives();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        const emptyProfile = {
          company_name: '',
          tax_id: '',
          brand_name: '',
          legal_address: '',
          warehouse_address: '',
          phone: '',
          email: user.email || '',
        };
        setProfile(null);
        setEditedProfile(emptyProfile);
        setIsEditing(true);
        setError('Por favor, complete su perfil para continuar.');
        return;
      }

      setProfile(data[0]);
      setEditedProfile(data[0]);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError('Error al cargar el perfil. Por favor, intente nuevamente.');
    }
  };

  const fetchRepresentatives = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRepresentatives(data || []);
    } catch (error) {
      console.error('Error fetching representatives:', error);
    }
  };

  const validateProfile = (profile: UserProfile) => {
    if (!profile.company_name) return 'La razón social es requerida';
    if (!profile.tax_id) return 'El CUIT es requerido';
    if (!profile.brand_name) return 'El nombre comercial es requerido';
    if (!profile.legal_address) return 'El domicilio legal es requerido';
    if (!profile.warehouse_address) return 'El domicilio del depósito es requerido';
    if (!profile.phone) return 'El teléfono es requerido';
    if (!profile.email) return 'El correo electrónico es requerido';
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(profile.email)) {
      return 'El correo electrónico no es válido';
    }
    return null;
  };

  const handleProfileUpdate = async () => {
    if (!editedProfile || !user) return;

    const validationError = validateProfile(editedProfile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          ...editedProfile,
          created_at: profile ? undefined : new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      const { data: updatedData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setProfile(updatedData);
      setEditedProfile(updatedData);
      setIsEditing(false);
      setError(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.message.includes('users_tax_id_key')) {
        setError('El CUIT ingresado ya está registrado');
      } else if (error.message.includes('users_email_key')) {
        setError('El correo electrónico ingresado ya está registrado');
      } else {
        setError('Error al actualizar el perfil. Por favor, intente nuevamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRepresentativeToggle = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('representatives')
        .update({ include_in_djc: !currentValue })
        .eq('id', id);

      if (error) throw error;
      await fetchRepresentatives();
    } catch (error) {
      console.error('Error toggling representative:', error);
    }
  };

  const handleAddRepresentative = async () => {
    try {
      const { error } = await supabase.from('representatives').insert([
        {
          user_id: user?.id,
          name: 'Nuevo Representante',
          position: 'Cargo',
          include_in_djc: false,
        },
      ]);

      if (error) throw error;
      await fetchRepresentatives();
    } catch (error) {
      console.error('Error adding representative:', error);
    }
  };

  const handleDeleteRepresentative = async (id: string) => {
    try {
      const { error } = await supabase
        .from('representatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchRepresentatives();
    } catch (error) {
      console.error('Error deleting representative:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Información de la Empresa
          </h2>
          {profile && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary px-4 py-2"
            >
              Editar
            </button>
          ) : (
            <div className="space-x-2">
              {profile && (
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProfile(profile);
                    setError(null);
                  }}
                  className="btn-secondary px-4 py-2"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="btn-primary px-4 py-2"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Razón Social</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.company_name || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, company_name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese la razón social"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.company_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">C.U.I.T.</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.tax_id || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, tax_id: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el CUIT"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.tax_id || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre Comercial o Marca Registrada
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.brand_name || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, brand_name: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el nombre comercial"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.brand_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domicilio Legal</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.legal_address || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, legal_address: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el domicilio legal"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.legal_address || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Domicilio Planta o Depósito
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.warehouse_address || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, warehouse_address: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el domicilio del depósito"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.warehouse_address || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile?.phone || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, phone: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el teléfono"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            {isEditing ? (
              <input
                type="email"
                value={editedProfile?.email || user?.email || ''}
                onChange={(e) =>
                  setEditedProfile(prev => ({ ...prev!, email: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingrese el correo electrónico"
                required
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{profile?.email || user?.email || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {profile && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Representantes Autorizados
            </h2>
            <button
              onClick={handleAddRepresentative}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Agregar Representante
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Incluir en DJC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {representatives.map((rep) => (
                  <tr key={rep.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {rep.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {rep.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={rep.include_in_djc}
                          onChange={() => handleRepresentativeToggle(rep.id, rep.include_in_djc)}
                          className="form-checkbox h-4 w-4 text-indigo-600 dark:text-indigo-400"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteRepresentative(rep.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;