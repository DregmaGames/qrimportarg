import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DJCHistoryItem {
  id: string;
  djc_id: string;
  action: string;
  changed_fields: Record<string, any>;
  created_at: string;
  created_by: string;
  user_email?: string;
}

interface DJCHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  djcId: string;
}

export function DJCHistoryModal({ isOpen, onClose, djcId }: DJCHistoryModalProps) {
  const [history, setHistory] = useState<DJCHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && djcId) {
      fetchHistory(djcId);
    }
  }, [isOpen, djcId]);

  const fetchHistory = async (djcId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('djc_history')
        .select('*')
        .eq('djc_id', djcId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user emails for each history item
      const historyWithUserEmails = await Promise.all(
        (data || []).map(async (item) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('usuarios')
              .select('email')
              .eq('auth_user_id', item.created_by)
              .maybeSingle();

            if (userError) throw userError;
            return { ...item, user_email: userData?.email || 'Usuario desconocido' };
          } catch (error) {
            console.error('Error fetching user data:', error);
            return { ...item, user_email: 'Usuario desconocido' };
          }
        })
      );

      setHistory(historyWithUserEmails);
    } catch (error) {
      console.error('Error fetching DJC history:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Creación';
      case 'update':
        return 'Actualización';
      case 'sign':
        return 'Firma';
      default:
        return action;
    }
  };

  const getChangedFieldsText = (changedFields: Record<string, any>) => {
    if (!changedFields || Object.keys(changedFields).length === 0) return 'No hay campos modificados';
    
    return Object.keys(changedFields)
      .map((key) => {
        const fieldName = getFieldLabel(key);
        if (key === 'firma_url' && changedFields[key]) {
          return `Se agregó la firma`;
        }
        return `${fieldName}`;
      })
      .join(', ');
  };

  const getFieldLabel = (fieldKey: string) => {
    const fieldLabels: Record<string, string> = {
      resolucion: 'Resolución',
      razon_social: 'Razón Social',
      cuit: 'CUIT',
      marca: 'Marca',
      domicilio_legal: 'Domicilio Legal',
      domicilio_planta: 'Domicilio de Planta',
      telefono: 'Teléfono',
      email: 'Email',
      representante_nombre: 'Nombre del Representante',
      representante_domicilio: 'Domicilio del Representante',
      representante_cuit: 'CUIT del Representante',
      codigo_producto: 'Código de Producto',
      fabricante: 'Fabricante',
      identificacion_producto: 'Identificación del Producto',
      reglamentos: 'Reglamentos',
      normas_tecnicas: 'Normas Técnicas',
      documento_evaluacion: 'Documento de Evaluación',
      enlace_declaracion: 'Enlace de Declaración',
      fecha_lugar: 'Fecha y Lugar',
      firma_url: 'Firma',
      pdf_url: 'PDF'
    };

    return fieldLabels[fieldKey] || fieldKey;
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Historial de Declaración Jurada
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No hay historial disponible</h3>
                    <p className="text-gray-500">
                      No se ha registrado ningún cambio para esta declaración jurada.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {history.map((item, index) => (
                          <li key={item.id}>
                            <div className="relative pb-8">
                              {index !== history.length - 1 && (
                                <span
                                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                    <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm text-gray-900">
                                      {getActionLabel(item.action)}{' '}
                                      <span className="font-medium">
                                        {getChangedFieldsText(item.changed_fields)}
                                      </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Por: {item.user_email}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs whitespace-nowrap text-gray-500">
                                    {format(new Date(item.created_at), 'PPp', { locale: es })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}