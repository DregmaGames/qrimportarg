import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserPlus, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  companyName: z.string().min(1, 'La razón social es requerida'),
  taxId: z
    .string()
    .min(1, 'El CUIT es requerido')
    .regex(/^\d{2}-\d{8}-\d{1}$/, 'El CUIT debe tener el formato XX-XXXXXXXX-X'),
  brandName: z.string().min(1, 'El nombre comercial es requerido'),
  legalAddress: z.string().min(1, 'El domicilio legal es requerido'),
  warehouseAddress: z.string().min(1, 'El domicilio del depósito es requerido'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^\+?[\d\s-]{8,}$/, 'Ingrese un número de teléfono válido'),
  email: z
    .string()
    .email('El correo electrónico no es válido')
    .min(1, 'El correo electrónico es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const checkDuplicates = async (email: string, taxId: string) => {
    const { data: emailCheck, error: emailError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (emailError) throw emailError;
    if (emailCheck) return { field: 'email', message: 'Este correo electrónico ya está registrado' };

    const { data: taxIdCheck, error: taxIdError } = await supabase
      .from('users')
      .select('tax_id')
      .eq('tax_id', taxId)
      .maybeSingle();

    if (taxIdError) throw taxIdError;
    if (taxIdCheck) return { field: 'taxId', message: 'Este CUIT ya está registrado' };

    return null;
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Check for duplicates before creating the account
      const duplicateCheck = await checkDuplicates(data.email, data.taxId);
      if (duplicateCheck) {
        setError(duplicateCheck.field as any, { message: duplicateCheck.message });
        return;
      }

      // Create auth user
      const { error: signUpError, data: authData } = await signUp(data.email, data.password);
      if (signUpError) throw signUpError;

      if (!authData.user?.id) {
        throw new Error('No se pudo crear la cuenta. Por favor, intente nuevamente.');
      }

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert([
        {
          id: authData.user.id,
          company_name: data.companyName,
          tax_id: data.taxId,
          brand_name: data.brandName,
          legal_address: data.legalAddress,
          warehouse_address: data.warehouseAddress,
          phone: data.phone,
          email: data.email,
        },
      ]);

      if (profileError) throw profileError;

      // Sign out after registration
      await supabase.auth.signOut();
      
      navigate('/login', {
        state: { message: 'Cuenta creada exitosamente. Por favor, inicie sesión.' },
      });
    } catch (error: any) {
      console.error('Error en el registro:', error);
      
      if (error.message?.includes('duplicate key')) {
        if (error.message.includes('tax_id')) {
          setError('taxId', { message: 'Este CUIT ya está registrado' });
        } else if (error.message.includes('email')) {
          setError('email', { message: 'Este correo electrónico ya está registrado' });
        }
      } else {
        setServerError(
          error.message || 'Ocurrió un error durante el registro. Por favor, intente nuevamente.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear cuenta
          </h2>
        </div>

        {serverError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{serverError}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Razón Social
              </label>
              <input
                id="companyName"
                type="text"
                {...register('companyName')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingrese la razón social"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                CUIT
              </label>
              <input
                id="taxId"
                type="text"
                {...register('taxId')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="XX-XXXXXXXX-X"
              />
              {errors.taxId && (
                <p className="mt-1 text-sm text-red-600">{errors.taxId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="brandName" className="block text-sm font-medium text-gray-700">
                Nombre Comercial
              </label>
              <input
                id="brandName"
                type="text"
                {...register('brandName')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingrese el nombre comercial"
              />
              {errors.brandName && (
                <p className="mt-1 text-sm text-red-600">{errors.brandName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="legalAddress" className="block text-sm font-medium text-gray-700">
                Domicilio Legal
              </label>
              <input
                id="legalAddress"
                type="text"
                {...register('legalAddress')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingrese el domicilio legal"
              />
              {errors.legalAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.legalAddress.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="warehouseAddress" className="block text-sm font-medium text-gray-700">
                Domicilio del Depósito
              </label>
              <input
                id="warehouseAddress"
                type="text"
                {...register('warehouseAddress')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingrese el domicilio del depósito"
              />
              {errors.warehouseAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.warehouseAddress.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Ingrese el teléfono"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="correo@ejemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ¿Ya tiene una cuenta? Iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;