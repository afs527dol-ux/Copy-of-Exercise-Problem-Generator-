import React, { useState } from 'react';
import { Tab, GeneratedQuestion } from './types';
import ProblemGenerator from './components/ProblemGenerator';
import ProblemList from './components/ProblemList';
import { LogoIcon, TargetIcon, ListIcon } from './components/icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Generate);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  const handleProblemsGenerated = (newQuestions: GeneratedQuestion[]) => {
    setQuestions(prev => [...newQuestions, ...prev]);
    setActiveTab(Tab.List);
  };

  const handleResetProblems = () => {
    setQuestions([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <header className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center">
          <div className="flex items-center space-x-3">
            <LogoIcon className="w-10 h-10" />
            <h1 className="text-3xl font-bold">연습문제 생성기</h1>
          </div>
          <p className="mt-2 text-indigo-200 text-center">
            AI가 학습 자료를 분석하여 자동으로 문제를 만들어드립니다
          </p>
        </header>

        <main>
          <nav className="flex border-b border-gray-200">
            <TabButton
              isActive={activeTab === Tab.Generate}
              onClick={() => setActiveTab(Tab.Generate)}
            >
              <TargetIcon className="w-5 h-5 mr-2" />
              문제 생성
            </TabButton>
            <TabButton
              isActive={activeTab === Tab.List}
              onClick={() => setActiveTab(Tab.List)}
            >
              <ListIcon className="w-5 h-5 mr-2" />
              문제 목록
            </TabButton>
          </nav>
          
          <div className="p-6 md:p-8">
            {activeTab === Tab.Generate ? (
              <ProblemGenerator onProblemsGenerated={handleProblemsGenerated} />
            ) : (
              <ProblemList questions={questions} onReset={handleResetProblems} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
  const baseClasses = "flex-1 flex items-center justify-center p-4 text-sm font-semibold transition-colors duration-200 focus:outline-none";
  const activeClasses = "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50";
  const inactiveClasses = "text-gray-500 hover:bg-gray-100";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </button>
  );
};

export default App;