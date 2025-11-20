
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Role, Subject, ChatSession, FeedbackType } from './types';
import { sendMessageToGemini } from './services/gemini';
import { loadSessions, saveSessions } from './services/storage';
import { SubjectSelector } from './components/SubjectSelector';
import { InputArea } from './components/InputArea';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { Sidebar } from './components/Sidebar';
import { Bot, User, Menu, ThumbsUp, ThumbsDown, Share2, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) {
      setSessions(loaded);
      setCurrentSessionId(loaded[0].id);
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isLoading]);

  // Toast Timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'Nouveau Devoir',
      subject: Subject.GENERAL,
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const activeSession = sessions.find(s => s.id === currentSessionId);

  const handleSubjectChange = (subj: Subject) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => 
      s.id === activeSession.id ? { ...s, subject: subj } : s
    ));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      saveSessions(newSessions); 
      
      if (currentSessionId === id) {
        if (newSessions.length > 0) {
          setCurrentSessionId(newSessions[0].id);
        } else {
          const newId = uuidv4();
          const emptySession: ChatSession = {
            id: newId,
            title: 'Nouveau Devoir',
            subject: Subject.GENERAL,
            messages: [],
            createdAt: Date.now(),
          };
          setSessions([emptySession]);
          setCurrentSessionId(newId);
        }
      }
    }
  };

  const handleExportChat = async () => {
    if (!activeSession) return;

    const dateStr = new Date(activeSession.createdAt).toLocaleDateString('fr-FR');
    const header = `Ds Siaka - Aide aux Devoirs\nTitre: ${activeSession.title}\nMatière: ${activeSession.subject}\nDate: ${dateStr}\n-------------------------------\n\n`;
    
    const body = activeSession.messages.map(msg => {
      const role = msg.role === Role.USER ? 'Moi' : 'Ds Siaka';
      return `[${role}]:\n${msg.text}\n`;
    }).join('\n-------------------------------\n\n');

    const fullText = header + body;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeSession.title,
          text: fullText,
        });
        setToast("Conversation partagée !");
        return;
      } catch (error) {
        console.log('Sharing failed, falling back to download');
      }
    }

    // Fallback to file download
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename
    const safeTitle = activeSession.title.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
    a.download = `DsSiaka_${safeTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast("Fichier téléchargé !");
  };

  const handleFeedback = (messageId: string, type: FeedbackType) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          messages: s.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, feedback: msg.feedback === type ? null : type } 
              : msg
          )
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async (text: string, images: string[]) => {
    if (!activeSession) return;

    const userMsgId = uuidv4();
    const userMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text,
      images,
      timestamp: Date.now(),
    };

    let newTitle = activeSession.title;
    if (activeSession.messages.length === 0) {
      newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    const updatedSessionWithUser = {
      ...activeSession,
      title: newTitle,
      messages: [...activeSession.messages, userMessage]
    };

    setSessions(prev => prev.map(s => s.id === activeSession.id ? updatedSessionWithUser : s));
    setIsLoading(true);

    const botMsgId = uuidv4();
    const botMessagePlaceholder: Message = {
      id: botMsgId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
    };

    const sessionWithPlaceholder = {
      ...updatedSessionWithUser,
      messages: [...updatedSessionWithUser.messages, botMessagePlaceholder]
    };
    setSessions(prev => prev.map(s => s.id === activeSession.id ? sessionWithPlaceholder : s));

    try {
      const historyForApi = [...activeSession.messages, userMessage];
      
      await sendMessageToGemini(
        historyForApi,
        text,
        images,
        activeSession.subject,
        (streamedText) => {
          setSessions(prev => 
            prev.map((session) => {
              if (session.id === activeSession.id) {
                return {
                  ...session,
                  messages: session.messages.map(msg => 
                    msg.id === botMsgId ? { ...msg, text: streamedText } : msg
                  )
                };
              }
              return session;
            })
          );
        }
      );
    } catch (error) {
      setSessions(prev => 
        prev.map((session) => {
          if (session.id === activeSession.id) {
            return {
              ...session,
              messages: session.messages.map(msg => 
                msg.id === botMsgId ? { ...msg, text: "Désolé, j'ai rencontré une erreur. Veuillez vérifier votre connexion.", isError: true } : msg
              )
            };
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!activeSession) return <div className="flex items-center justify-center h-screen text-slate-400">Chargement...</div>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full bg-white relative">
        
        {/* Toast Notification */}
        {toast && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white border-b border-slate-100 p-4 flex flex-col gap-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 max-w-[70%]">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-800 truncate">{activeSession.title}</h1>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                   <span>{activeSession.subject}</span>
                   <span className="text-slate-300">•</span>
                   <span>{new Date(activeSession.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleExportChat}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200 hover:border-indigo-200 text-sm font-medium"
              title="Partager la conversation"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>
          
          <SubjectSelector 
            currentSubject={activeSession.subject} 
            onSelect={handleSubjectChange} 
          />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <Bot size={40} className="text-indigo-400" />
              </div>
              <div className="text-center max-w-xs px-4">
                <h2 className="text-lg font-semibold text-slate-700">Bonjour ! Je suis Ds Siaka</h2>
                <p className="text-sm mt-2 text-slate-500">
                  Sélectionnez une matière ci-dessus et posez-moi n'importe quelle question. Je suis là pour vous aider dans vos devoirs !
                </p>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 max-w-3xl mx-auto ${msg.role === Role.USER ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                  ${msg.role === Role.USER ? 'bg-indigo-600' : 'bg-emerald-600'}
                `}>
                  {msg.role === Role.USER ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[85%] ${msg.role === Role.USER ? 'items-end' : 'items-start'}`}>
                  
                  <div className={`
                    rounded-2xl px-5 py-3.5 shadow-sm overflow-hidden
                    ${msg.role === Role.USER 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                    }
                    ${msg.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}
                  `}>
                    
                    {/* Images */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {msg.images.map((img, i) => (
                          <img 
                            key={i} 
                            src={`data:image/jpeg;base64,${img}`} 
                            alt="Homework attachment" 
                            className="rounded-lg max-h-48 max-w-full object-contain border border-black/10 bg-white"
                          />
                        ))}
                      </div>
                    )}

                    {/* Text */}
                    <div className={msg.role === Role.USER ? 'text-sm leading-relaxed' : ''}>
                      {msg.role === Role.USER ? (
                         <div className="whitespace-pre-wrap font-light">{msg.text}</div>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-1 px-1">
                    <span className="text-[10px] text-slate-400 select-none">
                      {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Feedback Buttons (Only for Model) */}
                    {msg.role === Role.MODEL && !msg.isError && (
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => handleFeedback(msg.id, 'like')}
                           className={`p-1 rounded transition-colors ${msg.feedback === 'like' ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-green-600'}`}
                           title="Utile"
                         >
                           <ThumbsUp size={14} />
                         </button>
                         <button 
                           onClick={() => handleFeedback(msg.id, 'dislike')}
                           className={`p-1 rounded transition-colors ${msg.feedback === 'dislike' ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500'}`}
                           title="Pas utile"
                         >
                           <ThumbsDown size={14} />
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isLoading && activeSession.messages[activeSession.messages.length - 1]?.role === Role.USER && (
             <div className="flex gap-4 max-w-3xl mx-auto">
               <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                 <Bot size={16} className="text-white" />
               </div>
               <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center space-x-1">
                 <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="max-w-3xl mx-auto w-full">
           <InputArea onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default App;
