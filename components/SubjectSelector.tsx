import React from 'react';
import { Subject } from '../types';
import { SUBJECT_CONFIGS } from '../constants';
import * as Icons from 'lucide-react';

interface SubjectSelectorProps {
  currentSubject: Subject;
  onSelect: (subject: Subject) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({ currentSubject, onSelect }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
      {(Object.values(Subject) as Subject[]).map((subj) => {
        const config = SUBJECT_CONFIGS[subj];
        // Dynamic Icon loading
        const IconComponent = (Icons as any)[config.icon]; 
        const isSelected = currentSubject === subj;

        return (
          <button
            key={subj}
            onClick={() => onSelect(subj)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-full border transition-all duration-200 whitespace-nowrap
              ${isSelected 
                ? `${config.color} border-transparent ring-2 ring-offset-1 ring-indigo-200 shadow-sm` 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
              }
            `}
          >
            {IconComponent && <IconComponent size={16} />}
            <span className="font-medium text-sm">{subj}</span>
          </button>
        );
      })}
    </div>
  );
};
