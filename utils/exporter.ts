import { Packer, Document, Paragraph, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';
import saveAs from 'file-saver';
import { GeneratedQuestion, QuestionType } from '../types';

// Type guard to check if a question is True/False
const isTrueFalse = (q: GeneratedQuestion): q is import('../types').TrueFalseQuestion => 'answer' in q;

// --- DOCX Exporter ---
export const exportToDocx = async (questions: GeneratedQuestion[]) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: questions.flatMap((q, index) => {
        const children = [
          new Paragraph({
            children: [
              new TextRun({
                text: `Q${questions.length - index}. ${q.question}`,
                bold: true,
                size: 28, // 14pt
              }),
            ],
            spacing: { after: 200 },
          }),
        ];

        if (isTrueFalse(q)) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `정답: ${q.answer ? 'O' : 'X'}`, size: 24 }),
              ],
            })
          );
        } else {
          q.options.forEach((option, i) => {
            children.push(
              new Paragraph({
                text: `${i + 1}. ${option}`,
                indent: { left: 720 }, // 0.5 inch
                style: "ListParagraph",
              })
            );
          });
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `정답: ${q.correctAnswerIndex + 1}번`, size: 24 }),
              ],
            })
          );
        }

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `해설: ${q.explanation}`, size: 24, italics: true }),
            ],
            spacing: { after: 400 },
          })
        );

        return children;
      }),
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, '문제_목록.docx');
};


// --- PPTX Exporter ---
export const exportToPptx = async (questions: GeneratedQuestion[]) => {
    let pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';

    questions.forEach((q, index) => {
        let slide = pres.addSlide();
        slide.addText(`Q${questions.length - index}. ${q.question}`, { 
            x: 0.5, y: 0.5, w: '90%', h: 1, 
            fontSize: 24, bold: true, color: '363636' 
        });

        if (isTrueFalse(q)) {
            slide.addText(`정답: ${q.answer ? 'O (True)' : 'X (False)'}`, {
                x: 0.5, y: 1.5, w: '90%', h: 1, fontSize: 18
            });
        } else {
            const optionsText = q.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n');
            slide.addText(optionsText, { x: 0.5, y: 1.5, w: '90%', h: 2, fontSize: 18 });
            slide.addText(`정답: ${q.correctAnswerIndex + 1}번`, { x: 0.5, y: 3.7, w: '90%', h: 0.5, fontSize: 16, bold: true });
        }
        
        slide.addText(`해설: ${q.explanation}`, {
            x: 0.5, y: 4.5, w: '90%', h: 1, 
            fontSize: 14, color: '7F7F7F'
        });
    });

    pres.writeFile({ fileName: '문제_목록.pptx' });
};


// --- XLSX Exporter ---
export const exportToXlsx = async (questions: GeneratedQuestion[]) => {
    const data = questions.map((q, index) => {
        const row: { [key: string]: string | number } = {
            '번호': index + 1,
            '문제': q.question,
            '보기 1': '',
            '보기 2': '',
            '보기 3': '',
            '보기 4': '',
            '정답': '',
            '해설': q.explanation,
            '유형': '',
        };

        if (isTrueFalse(q)) {
            row['유형'] = '진위형 (O/X)';
            row['정답'] = q.answer ? 'O' : 'X';
        } else {
            row['유형'] = '객관식';
            row['보기 1'] = q.options[0] || '';
            row['보기 2'] = q.options[1] || '';
            row['보기 3'] = q.options[2] || '';
            row['보기 4'] = q.options[3] || '';
            row['정답'] = q.correctAnswerIndex + 1;
        }
        return row;
    });

    const headers = ['번호', '문제', '보기 1', '보기 2', '보기 3', '보기 4', '정답', '해설', '유형'];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '문제 목록');

    // Adjust column widths
    const colWidths = [
        { wch: 5 },  // 번호
        { wch: 60 }, // 문제
        { wch: 30 }, // 보기 1
        { wch: 30 }, // 보기 2
        { wch: 30 }, // 보기 3
        { wch: 30 }, // 보기 4
        { wch: 5 },  // 정답
        { wch: 40 }, // 해설
        { wch: 15 }, // 유형
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, '문제_목록.xlsx');
};