import type { EChartsOption } from 'echarts';
import { useEffect, useRef } from 'react';

import { montarGrafica } from './echarts';

export function Grafica({ opcion }: { opcion: EChartsOption }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contenedor.current === null) return;
    const grafica = montarGrafica(contenedor.current);
    grafica.setOption(opcion);
    const ajustar = () => grafica.resize();
    window.addEventListener('resize', ajustar);
    return () => {
      window.removeEventListener('resize', ajustar);
      grafica.dispose();
    };
  }, [opcion]);

  return <div ref={contenedor} className="grafica" />;
}
