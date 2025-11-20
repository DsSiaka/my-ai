
import React from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, Trash2, X, Clock, Share2 } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  const handleShareApp = async () => {
    const shareData = {
      title: 'Ds Siaka',
      text: 'Découvre Ds Siaka, l\'IA d\'aide aux devoirs créée par Siaka Keita !',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full shadow-xl md:shadow-none
      `}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-lg tracking-tight">Ds Siaka</h2>
            <p className="text-xs text-slate-500">Historique & Sessions</p>
          </div>
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl transition-all shadow-sm font-medium text-sm group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />
            <span>Nouveau Devoir</span>
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
              <Clock size={32} className="mb-2 opacity-40" />
              <p>Aucun historique</p>
            </div>
          ) : (
            sessions
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border
                  ${currentSessionId === session.id 
                    ? 'bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm' 
                    : 'hover:bg-slate-50 border-transparent text-slate-700'
                  }
                `}
              >
                <MessageSquare size={18} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {session.title || 'Nouvelle Conversation'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <span>{session.subject}</span>
                    <span>•</span>
                    <span>{new Date(session.createdAt).toLocaleDateString('fr-FR')}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id, e);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Footer attribution and Share App */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <button 
            onClick={handleShareApp}
            className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            <Share2 size={16} />
            <span>Partager l'application</span>
          </button>

          <div className="text-xs text-slate-500 text-center">
            <p className="font-semibold text-indigo-900">Ds Siaka AI</p>
            <p className="mt-1 leading-relaxed opacity-75">
              Créé par Siaka Keita<br/>
              11ème SES • Lycée La Lanterne
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
