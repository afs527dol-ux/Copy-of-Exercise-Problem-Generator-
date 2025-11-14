
export enum Tab {
  Generate = 'GENERATE',
  List = 'LIST',
}

export enum QuestionType {
  TrueFalse = 'TRUE_FALSE',
  MultipleChoice = 'MULTIPLE_CHOICE',
}

export interface TrueFalseQuestion {
  question: string;
  answer: boolean;
  explanation: string;
}

export interface MultipleChoiceQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type GeneratedQuestion = TrueFalseQuestion | MultipleChoiceQuestion;
