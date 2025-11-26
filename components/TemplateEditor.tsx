import React, { useState, useEffect } from 'react';
import { TemplateConfig } from '../types';
import { X, Save, RotateCcw } from 'lucide-react';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: TemplateConfig;
  onSave: (config: TemplateConfig) => void;
  styleName: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  isOpen,
  onClose,
  initialConfig,
  onSave,
  styleName,
}) => {
  const [systemPrompt, setSystemPrompt] = useState(initialConfig.systemPrompt);
  const [examples, setExamples] = useState(initialConfig.examples);

  // Reset local state when the modal opens with new props
  useEffect(() => {
    if (isOpen) {
      setSystemPrompt(initialConfig.systemPrompt);
      setExamples(initialConfig.examples);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      ...initialConfig,
      systemPrompt,
      examples,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Edit {styleName} Template</h3>
            <p className="text-sm text-gray-500">Customize how the AI generates this style.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* System Prompt Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              System Prompt (The Persona)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Define who the AI is, the tone of voice, and strict formatting rules.
            </p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-40 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-white font-mono leading-relaxed"
              placeholder="You are an expert ghostwriter..."
            />
          </div>

          {/* Examples Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Few-Shot Examples
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Provide Input/Output pairs to guide the AI. This significantly improves quality.
            </p>
            <textarea
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              className="w-full h-40 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50 font-mono leading-relaxed"
              placeholder="Input: ... Output: ..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
                setSystemPrompt(initialConfig.systemPrompt);
                setExamples(initialConfig.examples);
            }}
             className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors mr-auto"
          >
              <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all transform hover:scale-[1.02]"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;