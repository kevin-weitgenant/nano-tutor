import { Brain } from "lucide-react";

interface QuizButtonProps {
  onClick: () => void;
}

/**
 * Quiz button component that triggers the quiz modal
 */
export const QuizButton = ({ onClick }: QuizButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Take a Quiz">
      <Brain size={24} />
      <span className="font-medium">Quiz</span>
    </button>
  );
};

