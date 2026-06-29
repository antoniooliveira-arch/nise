import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      warning: <AlertCircle className="w-5 h-5" />,
      info: <Info className="w-5 h-5" />,
    };
    return icons[type];
  };

  const getStyles = (type: ToastType) => {
    const styles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-amber-500 text-white',
      info: 'bg-blue-500 text-white',
    };
    return styles[type];
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${getStyles(toast.type)} animate-slide-in`}
            style={{
              animation: 'slideIn 0.25s ease-out',
            }}
          >
            {getIcon(toast.type)}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-2 p-1 rounded hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;