import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Settings, 
  Send, 
  Copy, 
  RefreshCw, 
  MessageSquare, 
  Save as SaveIcon, 
  Sparkles,
  User,
  Bot,
  Plus,
  Pencil
} from 'lucide-react';
import { StyleType, TemplateConfig, Message, SavedThread, DefaultStyles } from './types';
import { DEFAULT_TEMPLATES } from './constants';
import { geminiService } from './services/geminiService';
import TemplateEditor from './components/TemplateEditor';

// --- Utility Components ---

const StyleCard = ({ 
  styleKey, 
  active, 
  config, 
  onClick, 
  onEdit,
  onRename
}: { 
  styleKey: string; 
  active: boolean; 
  config: TemplateConfig; 
  onClick: () => void; 
  onEdit: (e: React.MouseEvent) => void;
  onRename: (newName: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(config.name);

  // Sync tempName if config.name changes externally
  useEffect(() => {
    setTempName(config.name);
  }, [config.name]);

  const handleRenameSubmit = () => {
    if (tempName.trim()) {
      onRename(tempName.trim());
    } else {
      setTempName(config.name); // Revert if empty
    }
    setIsRenaming(false);
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative group cursor-pointer rounded-xl border-2 p-5 transition-all duration-300
        ${active 
          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]' 
          : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2 h-7">
        {isRenaming ? (
            <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                onClick={(e) => e.stopPropagation()} 
                className="font-bold text-gray-800 border-b border-blue-500 outline-none bg-transparent w-full text-base"
            />
        ) : (
            <div className="flex items-center gap-2 group/title w-full">
                <h3 
                  onClick={(e) => {
                       e.stopPropagation();
                       setIsRenaming(true);
                  }}
                  className={`font-bold ${active ? 'text-blue-700' : 'text-gray-800'} hover:underline decoration-dashed decoration-gray-400 underline-offset-4 cursor-text truncate`}
                >
                    {config.name}
                </h3>
                <button
                    onClick={(e) => {
                         e.stopPropagation();
                         setIsRenaming(true);
                    }}
                    className="opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity"
                >
                    <Pencil size={12} />
                </button>
            </div>
        )}
        {active && !isRenaming && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />}
      </div>
      <p className="text-xs text-gray-500 mb-6 leading-relaxed line-clamp-2">
        {config.description}
      </p>
      
      <button
        onClick={onEdit}
        className={`
          absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors
          ${active 
            ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' 
            : 'text-gray-400 bg-gray-100 hover:text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        <Settings size={12} />
        Prompt Template
      </button>
    </div>
  );
};

const ChatBubble = ({ message, onCopy, onSave }: { message: Message; onCopy?: (text: string) => void; onSave?: (text: string) => void; }) => {
  const isModel = message.role === 'model';
  
  return (
    <div className={`flex w-full mb-6 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm
          ${isModel ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-700'}
        `}>
          {isModel ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`
          group relative p-4 rounded-2xl text-sm leading-6 whitespace-pre-wrap shadow-sm
          ${isModel 
            ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
            : 'bg-blue-600 text-white rounded-tr-none'
          }
        `}>
          {message.content}

          {/* Action Buttons for Model responses */}
          {isModel && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 opacity-80 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onCopy && onCopy(message.content)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                <Copy size={12} /> Copy
              </button>
              <button 
                onClick={() => onSave && onSave(message.content)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
              >
                <SaveIcon size={12} /> Save
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---

const App: React.FC = () => {
  // State
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>(DefaultStyles.NATURAL);
  const [templates, setTemplates] = useState<Record<string, TemplateConfig>>(DEFAULT_TEMPLATES);
  const [styleOrder, setStyleOrder] = useState<string[]>(Object.keys(DEFAULT_TEMPLATES));
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [savedThreads, setSavedThreads] = useState<SavedThread[]>([]);

  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Handlers
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isProcessing]);

  const handleTemplateSave = (newConfig: TemplateConfig) => {
    setTemplates(prev => ({
      ...prev,
      [selectedStyle]: newConfig
    }));
  };
  
  const handleRenameStyle = (key: string, newName: string) => {
    setTemplates(prev => ({
        ...prev,
        [key]: {
            ...prev[key],
            name: newName
        }
    }));
  };

  const handleAddStyle = () => {
    const newKey = `STYLE_${Date.now()}`;
    const newTemplate: TemplateConfig = {
        name: 'New Style',
        description: 'Custom AI persona.',
        systemPrompt: 'You are a helpful AI assistant specialized in creating engaging content.',
        examples: 'Input: ... Output: ...'
    };
    
    setTemplates(prev => ({ ...prev, [newKey]: newTemplate }));
    setStyleOrder(prev => [...prev, newKey]);
    setSelectedStyle(newKey);
    setIsEditorOpen(true); // Open editor immediately for the new style
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const isNewSession = chatHistory.length === 0;
    setChatHistory([userMsg]); 
    
    try {
      // Initialize service with CURRENT style template
      const currentTemplate = templates[selectedStyle];
      geminiService.startChat(currentTemplate.systemPrompt, currentTemplate.examples);
      
      const responseText = await geminiService.sendMessage(inputText);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      
      setChatHistory([userMsg, modelMsg]);
      setInputText(''); // Clear input after successful generation
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
         id: Date.now().toString(),
         role: 'model',
         content: "Sorry, I encountered an error generating the thread. Please try again.",
         timestamp: Date.now()
      };
      setChatHistory([userMsg, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefine = async (refinementText: string) => {
    if (!refinementText.trim()) return;
    
    setIsProcessing(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: refinementText,
      timestamp: Date.now()
    };
    
    setChatHistory(prev => [...prev, userMsg]);

    try {
      // Continue existing session
      const responseText = await geminiService.sendMessage(refinementText);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, modelMsg]);
    } catch (error) {
        console.error(error);
        // Error handling visual
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const handleSaveThread = (content: string) => {
    const newSaved: SavedThread = {
      id: Date.now().toString(),
      content,
      style: selectedStyle,
      timestamp: Date.now()
    };
    setSavedThreads(prev => [newSaved, ...prev]);
  };

  const hasHistory = chatHistory.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Template Editor Modal */}
      {templates[selectedStyle] && (
        <TemplateEditor
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            initialConfig={templates[selectedStyle]}
            onSave={handleTemplateSave}
            styleName={templates[selectedStyle].name}
        />
      )}

      {/* LEFT SIDEBAR: Saved & Branding (Desktop) */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="fill-current" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">CraftPost</h1>
          </div>
          <p className="text-xs text-gray-500 mt-2">AI-powered viral content generator.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Saved Threads</h2>
          {savedThreads.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center mt-10">No saved threads yet.</p>
          ) : (
            <div className="space-y-3">
              {savedThreads.map(thread => (
                <div key={thread.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                        {templates[thread.style]?.name || 'Unknown'}
                    </span>
                    <button 
                       onClick={(e) => {
                           e.stopPropagation();
                           setSavedThreads(prev => prev.filter(t => t.id !== thread.id));
                       }}
                       className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                        &times;
                    </button>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    {thread.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen max-w-5xl mx-auto w-full">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
           <Sparkles className="text-blue-600 mr-2" />
           <h1 className="font-bold text-gray-900">CraftPost AI</h1>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            
            {/* INITIAL INPUT SECTION (Only show if no history, or if user wants to start over) */}
            <div className={`transition-all duration-500 ease-in-out ${hasHistory ? 'mb-8 opacity-40 hover:opacity-100' : 'mb-0 opacity-100'}`}>
                <div className="max-w-3xl mx-auto space-y-6">
                    
                    {/* Style Selection */}
                    <div>
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={handleAddStyle}
                                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline decoration-blue-200 underline-offset-2 transition-all"
                            >
                                <Plus size={16} />
                                新增風格
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {styleOrder.map((styleKey) => (
                                <StyleCard
                                    key={styleKey}
                                    styleKey={styleKey}
                                    active={selectedStyle === styleKey}
                                    config={templates[styleKey]}
                                    onClick={() => setSelectedStyle(styleKey)}
                                    onRename={(newName) => handleRenameStyle(styleKey, newName)}
                                    onEdit={(e) => {
                                        e.stopPropagation();
                                        setSelectedStyle(styleKey);
                                        setIsEditorOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your messy thoughts here... (e.g. 'i think remote work is good but lonely sometimes we need better tools')"
                            className="w-full h-64 p-4 md:p-6 bg-transparent text-white placeholder-gray-500 outline-none resize-y text-base"
                        />
                        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center border-t border-gray-700">
                           <span className="text-xs text-gray-400 hidden md:inline-block">
                               ✨ Pro tip: Don't worry about grammar. Just dump your brain.
                           </span>
                           <button
                                onClick={handleGenerate}
                                disabled={!inputText.trim() || isProcessing}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white transition-all
                                    ${!inputText.trim() || isProcessing 
                                        ? 'bg-gray-600 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    }
                                `}
                           >
                               {isProcessing ? (
                                   <>
                                     <RefreshCw className="animate-spin" size={18} /> Generating...
                                   </>
                               ) : (
                                   <>
                                     <PenTool size={18} /> Generate Thread
                                   </>
                               )}
                           </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT/RESULTS SECTION */}
            {hasHistory && (
                <div className="max-w-3xl mx-auto mt-8 border-t border-gray-200 pt-8 animate-fade-in-up">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <MessageSquare size={16} /> Result & Refinement
                    </h3>
                    
                    {/* Message List */}
                    <div className="space-y-2">
                        {chatHistory.map((msg) => (
                            <ChatBubble 
                                key={msg.id} 
                                message={msg} 
                                onCopy={handleCopy}
                                onSave={handleSaveThread}
                            />
                        ))}
                        {isProcessing && (
                             <div className="flex w-full mb-6 justify-start">
                                <div className="flex flex-row gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                        <Bot size={16} className="text-white animate-pulse" />
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms'}}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms'}}></span>
                                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms'}}></span>
                                        </span>
                                    </div>
                                </div>
                             </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Refinement Input */}
                    <div className="sticky bottom-6 mt-8">
                         <div className="bg-white rounded-full shadow-xl border border-gray-200 p-2 flex items-center gap-2">
                            <input
                                type="text"
                                disabled={isProcessing}
                                placeholder="Not quite right? Ask for changes (e.g. 'Make it shorter', 'Add more emojis')"
                                className="flex-1 px-4 py-2 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isProcessing) {
                                        handleRefine(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                            <button
                                disabled={isProcessing}
                                onClick={(e) => {
                                    const input = e.currentTarget.previousSibling as HTMLInputElement;
                                    handleRefine(input.value);
                                    input.value = '';
                                }}
                                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={16} />
                            </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;