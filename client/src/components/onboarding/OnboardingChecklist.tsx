import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onStartTour?: () => void;
}

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ items, onStartTour }) => {
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Primeiros Passos
        </h3>
        <span className="text-sm text-gray-600">
          {completedCount} de {totalCount} concluídos
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start p-3 rounded-lg transition-all ${
              item.completed
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={`text-sm font-medium ${
                  item.completed ? 'text-green-900 line-through' : 'text-gray-900'
                }`}
              >
                {item.title}
              </p>
              <p
                className={`text-xs mt-1 ${
                  item.completed ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {completedCount < totalCount && onStartTour && (
        <button
          onClick={onStartTour}
          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🎯 Iniciar Tour Guiado
        </button>
      )}

      {completedCount === totalCount && (
        <div className="mt-4 text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            🎉 Parabéns! Você concluiu todos os passos!
          </p>
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
