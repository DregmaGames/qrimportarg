import { useEffect, useState, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { Producto } from '../types/productos';

interface ProductTooltipProps {
  product: Producto;
  show: boolean;
  containerRef: React.RefObject<HTMLElement>;
}

export function ProductTooltip({ product, show, containerRef }: ProductTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    // Calculate available space above and below
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Determine placement based on available space
    const newPlacement = spaceBelow >= 200 ? 'bottom' : 'top';
    setPlacement(newPlacement);

    // Calculate position
    const newPosition = {
      left: rect.left + scrollLeft + rect.width / 2,
      top: newPlacement === 'bottom' 
        ? rect.bottom + scrollTop + 8
        : rect.top + scrollTop - 8
    };

    setPosition(newPosition);
  }, [containerRef]);

  useEffect(() => {
    if (show) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [show, updatePosition]);

  return (
    <Transition
      show={show}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-1"
      className="fixed z-50"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: `translate(-50%, ${placement === 'top' ? '-100%' : '0'})`,
      }}
    >
      <div
        id={`tooltip-${product.codigo_unico}`}
        role="tooltip"
        className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
      >
        {/* Arrow */}
        <div 
          className={`absolute left-1/2 -ml-2 w-4 h-4 bg-white border-t border-l border-gray-200 transform ${
            placement === 'top' 
              ? 'bottom-0 translate-y-1/2 rotate-[-45deg]' 
              : 'top-0 -translate-y-1/2 rotate-[135deg]'
          }`}
        />

        <div className="text-sm">
          <h4 className="font-semibold text-gray-900 mb-2">
            {product.nombre_producto}
          </h4>
          <div className="text-gray-600 mb-3 max-h-20 overflow-y-auto">
            {product.caracteristicas_tecnicas}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-medium text-gray-700 block mb-1">Fabricante</span>
              <p className="text-gray-600">{product.fabricante}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-1">Modelo</span>
              <p className="text-gray-600">{product.modelo}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-1">Estado</span>
              <p className="text-gray-600">
                {product.djc_estado === 'cargado' ? 'Documentación Completa' : 'Pendiente de DJC'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-1">QR</span>
              <p className="text-gray-600">
                {product.qr_generado ? 'Generado' : 'No Generado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}