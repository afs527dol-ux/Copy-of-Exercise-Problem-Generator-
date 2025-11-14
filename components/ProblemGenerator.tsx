import React, { useState, useRef } from 'react';
import { QuestionType, GeneratedQuestion } from '../types';
import { BookOpenIcon, TargetIcon, LoaderIcon, UploadCloudIcon, FileIcon, XIcon, HashIcon, TrueFalseIcon, MultipleChoiceIcon } from './icons';
import { generateQuestions } from '../services/geminiService';
import { extractTextFromFile } from '../utils/fileProcessor';

interface ProblemGeneratorProps {
  onProblemsGenerated: (questions: GeneratedQuestion[]) => void;
}

const ProblemGenerator: React.FC<ProblemGeneratorProps> = ({ onProblemsGenerated }) => {
  const [learningText, setLearningText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.TrueFalse);
  const [numQuestions, setNumQuestions] = useState<number>(3);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (selectedFile: File | undefined) => {
    if (selectedFile) {
      const allowedExtensions = ['.pdf', '.pptx', '.docx', '.xlsx'];
      const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;

      if (!allowedExtensions.includes(fileExtension)) {
          setError('지원하지 않는 파일 형식입니다. PDF, PPTX, DOCX, XLSX 파일을 업로드해주세요.');
          setFile(null);
          return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('파일 크기는 10MB를 초과할 수 없습니다.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0]);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
        handleFileSelect(droppedFiles[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!learningText.trim() && !file) {
      setError('학습 자료를 입력하거나 파일을 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    let sourceText = learningText;

    if (file) {
      setLoadingMessage('파일 처리 중...');
      try {
        sourceText = await extractTextFromFile(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일을 처리하는 중 오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }
    }

    if (!sourceText || !sourceText.trim()) {
      setError('입력된 텍스트가 없거나 파일에서 텍스트를 추출할 수 없습니다.');
      setIsLoading(false);
      return;
    }

    setLoadingMessage('문제 생성 중...');
    try {
      const questions = await generateQuestions(sourceText, questionType, numQuestions);
      onProblemsGenerated(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="flex items-center text-lg font-semibold text-gray-700 mb-2">
          <BookOpenIcon className="w-6 h-6 mr-2 text-gray-500" />
          학습 자료 텍스트를 입력하세요
        </label>
        <textarea
          value={learningText}
          onChange={(e) => setLearningText(e.target.value)}
          placeholder="예시 : 글로벌 투자 환경은 국가별 경기 사이클, 정책 변화, 환율 변동에 따라 성과 차이가 크다..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="flex items-center text-lg font-semibold text-gray-700 mb-2">
            <UploadCloudIcon className="w-6 h-6 mr-2 text-gray-500" />
            학습 자료 파일 업로드
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex items-center justify-center border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
        >
          <input id="file-upload" type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.pptx,.docx,.xlsx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isLoading} />
          {file ? (
            <div className="flex items-center justify-between w-full p-2 border border-gray-200 rounded-md bg-white">
                <div className="flex items-center min-w-0">
                    <FileIcon className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                </div>
                <button type="button" onClick={removeFile} className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
                <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                    <label htmlFor="file-upload" className="font-semibold text-indigo-600 hover:text-indigo-500 cursor-pointer">
                        여기를 클릭하여 파일 선택
                    </label>
                    {' '}또는 파일을 드래그하여 놓으세요
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    PDF, PPTX, DOCX, XLSX (최대 10MB)
                </p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">파일이 선택되면 텍스트 입력 내용은 무시됩니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-8">
        <div>
            <label htmlFor="num-questions" className="flex items-center text-lg font-semibold text-gray-700 mb-2">
                <HashIcon className="w-6 h-6 mr-2 text-gray-500" />
                생성할 문제 수
            </label>
            <input
                type="number"
                id="num-questions"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                min="1"
                max="10"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoading}
            />
        </div>
        <div>
            <fieldset>
            <legend className="flex items-center text-lg font-semibold text-gray-700 mb-2">
                문제 유형 선택
            </legend>
            <div className="grid grid-cols-2 gap-2">
                <QuestionTypeOption id="true-false" value={QuestionType.TrueFalse} checked={questionType === QuestionType.TrueFalse} onChange={() => setQuestionType(QuestionType.TrueFalse)} label="진위형 (O/X)" Icon={TrueFalseIcon} disabled={isLoading} />
                <QuestionTypeOption id="multiple-choice" value={QuestionType.MultipleChoice} checked={questionType === QuestionType.MultipleChoice} onChange={() => setQuestionType(QuestionType.MultipleChoice)} label="객관식 (4지선다)" Icon={MultipleChoiceIcon} disabled={isLoading} />
            </div>
            </fieldset>
        </div>
      </div>

      <div>
        <button type="submit" disabled={isLoading || (!learningText.trim() && !file)} className="w-full flex items-center justify-center p-4 text-white font-bold bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg">
          {isLoading ? (
            <>
              <LoaderIcon className="w-6 h-6 mr-2"/>
              {loadingMessage}
            </>
          ) : (
            <>
              <TargetIcon className="w-6 h-6 mr-2" />
              문제 생성하기
            </>
          )}
        </button>
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </form>
  );
};

interface QuestionTypeOptionProps {
  id: string;
  value: QuestionType;
  checked: boolean;
  onChange: () => void;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  disabled: boolean;
}

const QuestionTypeOption: React.FC<QuestionTypeOptionProps> = ({ id, value, checked, onChange, label, Icon, disabled }) => {
    const baseClasses = "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all duration-200";
    const activeClasses = "bg-indigo-600 text-white border-indigo-600 shadow-lg";
    const inactiveClasses = "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300";
    return (
        <label htmlFor={id} className={`${baseClasses} ${checked ? activeClasses : inactiveClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
                type="radio"
                id={id}
                name="questionType"
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="sr-only"
            />
            <Icon className="w-8 h-8 mb-2" />
            <span className="text-sm font-semibold">{label}</span>
        </label>
    );
};

export default ProblemGenerator;