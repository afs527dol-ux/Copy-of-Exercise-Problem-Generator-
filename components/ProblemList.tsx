
import React, { useState } from 'react';
import { GeneratedQuestion, TrueFalseQuestion, MultipleChoiceQuestion } from '../types';
import { 
  CheckCircleIcon, XCircleIcon, DownloadIcon, FileTextIcon, FilePresentationIcon, 
  FileSheetIcon, LoaderIcon, TrashIcon 
} from './icons';
import { exportToDocx, exportToPptx, exportToXlsx } from '../utils/exporter';

interface ProblemListProps {
  questions: GeneratedQuestion[];
  onReset: () => void;
}

const ProblemList: React.FC<ProblemListProps> = ({ questions, onReset }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">생성된 문제가 없습니다</h2>
        <p className="mt-2 text-gray-500">'문제 생성' 탭으로 이동하여 학습 자료로 문제를 만들어보세요.</p>
      </div>
    );
  }

  const handleExport = async (format: 'docx' | 'pptx' | 'xlsx') => {
    setIsExporting(true);
    setExportError(null);
    try {
      switch (format) {
        case 'docx':
          await exportToDocx(questions);
          break;
        case 'pptx':
          await exportToPptx(questions);
          break;
        case 'xlsx':
          await exportToXlsx(questions);
          break;
      }
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : '파일 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DownloadIcon className="w-6 h-6 mr-2 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">문제 다운로드</h3>
          </div>
          <div>
            {confirmingReset ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-700 hidden sm:inline">정말 삭제하시겠습니까?</span>
                <button
                  onClick={() => {
                    onReset();
                    setConfirmingReset(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  삭제
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  취소
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmingReset(true)} 
                disabled={isExporting}
                className="flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <TrashIcon className="w-4 h-4 mr-1.5" />
                목록 초기화
              </button>
            )}
          </div>
        </div>
        {isExporting && (
          <div className="flex items-center justify-center p-4 text-sm text-indigo-700 bg-indigo-100 rounded-md">
            <LoaderIcon className="w-5 h-5 mr-2" />
            파일을 생성 중입니다. 잠시만 기다려주세요...
          </div>
        )}
        {!isExporting && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ExportButton icon={FileTextIcon} label="Word" onClick={() => handleExport('docx')} disabled={isExporting} />
            <ExportButton icon={FilePresentationIcon} label="PPTX" onClick={() => handleExport('pptx')} disabled={isExporting} />
            <ExportButton icon={FileSheetIcon} label="Excel" onClick={() => handleExport('xlsx')} disabled={isExporting} />
          </div>
        )}
        {exportError && <p className="mt-2 text-sm text-red-600 text-center">{exportError}</p>}
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <p className="font-semibold text-gray-800 text-lg mb-4">
              <span className="text-indigo-600 font-bold mr-2">Q{questions.length - index}.</span>
              {q.question}
            </p>
            {'answer' in q ? <TrueFalseDisplay question={q} /> : <MultipleChoiceDisplay question={q} />}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-sm text-gray-600">해설</p>
              <p className="text-gray-700 mt-1">{q.explanation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ExportButtonProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ icon: Icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
        <Icon className="w-5 h-5 mr-2" />
        <span>{label}</span>
    </button>
);


const TrueFalseDisplay: React.FC<{ question: TrueFalseQuestion }> = ({ question }) => {
  return (
    <div className="flex items-center space-x-4">
      {question.answer ? (
        <span className="flex items-center font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
          <CheckCircleIcon className="w-5 h-5 mr-1.5" /> O (True)
        </span>
      ) : (
        <span className="flex items-center font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
          <XCircleIcon className="w-5 h-5 mr-1.5" /> X (False)
        </span>
      )}
    </div>
  );
};

const MultipleChoiceDisplay: React.FC<{ question: MultipleChoiceQuestion }> = ({ question }) => {
  return (
    <>
      <ul className="space-y-2">
        {question.options.map((option, index) => (
          <li key={index} className="flex items-start p-3 rounded-lg border bg-white border-gray-200 text-gray-800">
            <span className="font-semibold mr-2 text-gray-600">{index + 1}.</span>
            <span>{option}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
        <p className="text-green-800 font-medium text-center">
          <span className="font-bold">정답:</span> {question.correctAnswerIndex + 1}번
        </p>
      </div>
    </>
  );
};

export default ProblemList;
