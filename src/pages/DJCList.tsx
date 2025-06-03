import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Edit, Eye, Plus, History } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
import { DJCHistoryModal } from '../components/DJCHistoryModal';

interface DJC {
  id: string;
  resolucion: string;
  razon_social: string;
  marca: string;
  codigo_producto: string;
  fecha_lugar: string;
  created_at: string;
  firma_url: string | null;
  pdf_url: string | null;
}

interface DJCHistoryItem {
  id: string;
  djc_id: string;
  action: string;
  changed_fields: Record<string, any>;
  created_at: string;
  created_by: string;
}

const DJCList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [djcList, setDjcList] = useState<DJC[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDJC, setSelectedDJC] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchDJCs();
  }, [user]);

  const fetchDJCs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('djc')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDjcList(data || []);
    } catch (error) {
      console.error('Error fetching DJCs:', error);
      toast.error('Error al cargar las declaraciones juradas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDJC = () => {
    navigate('/djc/create');
  };

  const handleEditDJC = (id: string) => {
    navigate(`/djc/edit/${id}`);
  };

  const handleViewDJC = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleViewHistory = (id: string) => {
    setSelectedDJC(id);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Declaraciones Juradas de Conformidad</h1>
        <button
          onClick={handleCreateDJC}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva DJC
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : djcList.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay declaraciones juradas</h3>
          <p className="text-gray-500 mb-4">
            Aún no has creado ninguna declaración jurada de conformidad.
          </p>
          <button
            onClick={handleCreateDJC}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Crear DJC
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Comercial o Marca Registrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Razón Social
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {djcList.map((djc) => (
                  <tr key={djc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {djc.marca}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {djc.razon_social}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {djc.codigo_producto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(djc.created_at), 'dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {djc.firma_url ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Completo
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendiente firma
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleViewHistory(djc.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver historial"
                        >
                          <History className="h-5 w-5" />
                        </button>
                        {djc.pdf_url && (
                          <button
                            onClick={() => handleViewDJC(djc.pdf_url as string)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver PDF"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditDJC(djc.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
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

      {selectedDJC && (
        <DJCHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          djcId={selectedDJC}
        />
      )}
    </div>
  );
};

export default DJCList;