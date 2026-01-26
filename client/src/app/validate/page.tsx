"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { validate } from "@/services/auth";
import { useAuthStore } from "@/store/useAuthStore";

type ValidationState = 'loading' | 'success' | 'error' | 'idle';

export default function ValidatePage() {
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const searchParams = useSearchParams();
  const router = useRouter();

  const setUser = useAuthStore(state => state.setUser);
  const setAuthenticated = useAuthStore(state => state.setAuthenticated);
  const setLoading = useAuthStore(state => state.setLoading);
  const setPartnerId = useAuthStore(state => state.setPartnerId);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidationState('error');
    }
  }, [token]);

  const isValidating = useRef(false);
  const validateToken = async () => {
    if (!token || isValidating.current) return;
    
    isValidating.current = true;
    setValidationState('loading');

    const response = await validate(token);
    if(response?.success) {
      setValidationState('success');

      toast.success('Token validado correctamente, redirigiendo...');

      setPartnerId(null);
      localStorage.removeItem('partner_id');
      
      setUser(response?.data);
      setAuthenticated(true);
      setLoading(false);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
    else {
      setValidationState('error');
      toast.error(response?.message || 'Error al validar el token');
    }
  };

  const handleRequestNewToken = () => {
    window.open('https://coagrisansocios.com', '_blank');
  };

  const renderContent = () => {
    switch (validationState) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-brand-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Validando token...
            </h2>
            <p className="text-slate-600">
              Por favor espera mientras verificamos tu token de acceso.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              ¡Token válido!
            </h2>
            <p className="text-slate-600 mb-6">
              Tu token ha sido validado correctamente. Serás redirigido al sistema en unos segundos.
            </p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-brand-primary hover:bg-brand-primary-600 text-white"
            >
              Ir al Dashboard
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Token inválido
            </h2>
            <p className="text-slate-600 mb-6">
              El token proporcionado no es válido o ha expirado. Puedes solicitar un nuevo token.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleRequestNewToken}
                className="bg-brand-primary hover:bg-brand-primary-600 text-white w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Solicitar nuevo token
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header Corporativo */}
        <div className="bg-gradient-brand rounded-2xl p-8 text-white mb-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-md flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            Validación de Acceso
          </h1>
          <p className="text-slate-200 text-sm">
            Sistema de fichajes Coagrisan
          </p>
        </div>

        {/* Contenido de validación */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-8">
          {renderContent()}
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Si tienes problemas con la validación, contacta con el administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}