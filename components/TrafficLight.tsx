
import React from 'react';
import { DocStatus, DocType, VehicleDocument } from '../types';
import { cn } from '../lib/utils';

interface TrafficLightProps {
  documents: VehicleDocument[];
  docTypes: DocType[];
  className?: string;
}

const TrafficLight: React.FC<TrafficLightProps> = ({ documents, docTypes, className }) => {
  // Logic:
  // Red: any critical doc not 'ok'
  // Yellow: all critical 'ok', but some non-critical missing/in_progress
  // Green: all documents 'ok'

  const criticalTypes = docTypes.filter(dt => dt.is_critical);
  const criticalDocs = documents.filter(d => criticalTypes.some(ct => ct.id === d.doc_type_id));
  
  const anyCriticalNotOk = criticalTypes.some(ct => {
    const doc = documents.find(d => d.doc_type_id === ct.id);
    return !doc || doc.status !== 'ok';
  });

  const allDocsOk = docTypes.length > 0 && docTypes.every(dt => {
    const doc = documents.find(d => d.doc_type_id === dt.id);
    return doc?.status === 'ok';
  });

  let color = 'bg-green-500';
  let label = 'Completo';

  if (anyCriticalNotOk) {
    color = 'bg-red-500';
    label = 'Docs Críticos Faltantes';
  } else if (!allDocsOk) {
    color = 'bg-yellow-400';
    label = 'Docs Pendientes';
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-3 h-3 rounded-full animate-pulse", color)} />
      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default TrafficLight;
