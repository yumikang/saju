/**
 * Freemium PDF Generator
 *
 * Generates comprehensive PDF with all 10 unlocked names
 * Based on existing generator.server.ts pattern
 */

import PdfPrinter from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Font configuration (same as base generator)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

// ============================================================
// Types
// ============================================================

export interface FreemiumPdfData {
  session: {
    lastName: string;
    gender: string;
    birthDate: string;
    birthTime: string;
    selectedValues: string[];
  };
  names: any[];  // Top 10 candidates
  saju: any;     // Saju analysis
  yongsin: any;  // Yongsin analysis
  payment: {
    amount: number;
    completedAt: Date | null;
  };
}

// ============================================================
// Main Generator Function
// ============================================================

export async function generateFreemiumPDF(
  data: FreemiumPdfData
): Promise<Buffer> {
  // Build document definition
  const docDefinition: TDocumentDefinitions = {
    content: [
      // Cover Page
      ...buildCoverPage(data),

      // Page break
      { text: '', pageBreak: 'after' },

      // Summary Section
      ...buildSummarySection(data),

      // Page break
      { text: '', pageBreak: 'after' },

      // All 10 Names Detail
      ...buildNamesSection(data),

      // Page break
      { text: '', pageBreak: 'after' },

      // Saju Analysis Section
      ...buildSajuSection(data),

      // Footer
      ...buildFooter(),
    ],

    styles: {
      header: {
        fontSize: 24,
        bold: true,
        alignment: 'center',
      },
      sectionTitle: {
        fontSize: 18,
        bold: true,
        margin: [0, 20, 0, 10],
      },
      nameTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 15, 0, 5],
      },
      body: {
        fontSize: 11,
        margin: [0, 5, 0, 5],
      },
      footer: {
        fontSize: 9,
        color: '#666666',
        alignment: 'center',
      },
    },

    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],

    info: {
      title: `작명 결과 - ${data.session.lastName}씨 자녀`,
      author: 'Saju Naming Platform',
      subject: 'Premium Naming Results',
      keywords: 'saju, naming, Korean',
    },
  };

  // Generate PDF
  const pdfDoc = printer.createPdfKitDocument(docDefinition as any);

  // Convert to buffer
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}

// ============================================================
// Section Builders
// ============================================================

function buildCoverPage(data: FreemiumPdfData) {
  const genderText = data.session.gender === 'M' ? '남아' : '여아';

  return [
    { text: '', margin: [0, 100, 0, 0] },
    {
      text: '프리미엄 작명 결과',
      style: 'header',
      fontSize: 32,
    },
    { text: '', margin: [0, 20, 0, 0] },
    {
      text: `${data.session.lastName}씨 자녀 (${genderText})`,
      fontSize: 20,
      alignment: 'center',
    },
    { text: '', margin: [0, 40, 0, 0] },
    {
      text: [
        { text: '생년월일: ', bold: true },
        { text: data.session.birthDate },
      ],
      alignment: 'center',
      fontSize: 12,
    },
    {
      text: [
        { text: '생시: ', bold: true },
        { text: data.session.birthTime },
      ],
      alignment: 'center',
      fontSize: 12,
      margin: [0, 5, 0, 0],
    },
    { text: '', margin: [0, 60, 0, 0] },
    {
      text: `총 ${data.names.length}개의 프리미엄 이름`,
      fontSize: 14,
      alignment: 'center',
      color: '#2563eb',
    },
    { text: '', margin: [0, 100, 0, 0] },
    {
      text: `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
      fontSize: 10,
      alignment: 'center',
      color: '#666666',
    },
  ];
}

function buildSummarySection(data: FreemiumPdfData) {
  const top3 = data.names.slice(0, 3);

  return [
    {
      text: '🏆 TOP 3 추천 이름',
      style: 'sectionTitle',
    },
    {
      text: '사주 분석을 바탕으로 가장 조화로운 이름 3개입니다',
      style: 'body',
      color: '#666666',
    },
    { text: '', margin: [0, 10, 0, 0] },
    ...top3.map((name: any, index: number) => [
      {
        text: `${index + 1}위: ${data.session.lastName}${name.firstName.join('')}`,
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      {
        text: `한자: ${name.characters.map((c: any) => `${c.character}(${c.koreanReading})`).join(' ')}`,
        fontSize: 12,
        margin: [0, 0, 0, 3],
      },
      {
        text: `종합 점수: ${Math.round(name.scores.overall)}점`,
        fontSize: 11,
        color: '#059669',
        margin: [0, 0, 0, 5],
      },
    ]).flat(),
  ];
}

function buildNamesSection(data: FreemiumPdfData) {
  return [
    {
      text: '📋 전체 이름 상세 분석 (1-10위)',
      style: 'sectionTitle',
    },
    ...data.names.map((name: any, index: number) => [
      // Rank badge and name
      {
        text: `${index + 1}위: ${data.session.lastName}${name.firstName.join('')}`,
        style: 'nameTitle',
        background: index < 3 ? '#fef3c7' : undefined,
        margin: [0, index === 0 ? 10 : 20, 0, 5],
      },

      // Hanja details
      {
        text: `한자: ${name.characters.map((c: any) => `${c.character}(${c.koreanReading})`).join(' ')}`,
        fontSize: 12,
        margin: [0, 0, 0, 5],
      },

      // Scores
      {
        ul: [
          `종합 점수: ${Math.round(name.scores.overall)}점`,
          `오행 조화: ${Math.round(name.scores.elementHarmony?.score || 0)}점`,
          `음양 균형: ${Math.round(name.scores.yinYangBalance?.score || 0)}점`,
          `수리 길흉: ${Math.round(name.scores.numerology?.score || 0)}점`,
          `의미 조화: ${Math.round(name.scores.meaningHarmony?.score || 0)}점`,
        ],
        fontSize: 10,
        margin: [0, 5, 0, 5],
      },

      // Character meanings
      {
        text: '한자 의미:',
        fontSize: 11,
        bold: true,
        margin: [0, 5, 0, 3],
      },
      ...name.characters.map((char: any) => ({
        text: `  • ${char.character}: ${char.meaning} (${char.strokes}획, ${char.element}행)`,
        fontSize: 10,
        margin: [0, 2, 0, 2],
      })),

      // AI Explanation (if available)
      ...(name.aiExplanation
        ? [
            {
              text: '설명:',
              fontSize: 11,
              bold: true,
              margin: [0, 5, 0, 3],
            },
            {
              text: name.aiExplanation || '이 이름은 사주와 잘 어울립니다.',
              fontSize: 10,
              italics: true,
              color: '#4b5563',
              margin: [0, 0, 0, 10],
            },
          ]
        : []),
    ]).flat(),
  ];
}

function buildSajuSection(data: FreemiumPdfData) {
  const saju = data.saju || {};
  const yongsin = data.yongsin || {};

  return [
    {
      text: '🔮 사주 분석',
      style: 'sectionTitle',
    },

    // Saju Pillars
    {
      text: '사주팔자 (四柱八字)',
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    ...(saju.pillars
      ? [
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: '년주', bold: true, alignment: 'center' },
                  { text: '월주', bold: true, alignment: 'center' },
                  { text: '일주', bold: true, alignment: 'center' },
                  { text: '시주', bold: true, alignment: 'center' },
                ],
                [
                  {
                    text: `${saju.pillars.year?.gan || ''}\n${saju.pillars.year?.ji || ''}`,
                    alignment: 'center',
                  },
                  {
                    text: `${saju.pillars.month?.gan || ''}\n${saju.pillars.month?.ji || ''}`,
                    alignment: 'center',
                  },
                  {
                    text: `${saju.pillars.day?.gan || ''}\n${saju.pillars.day?.ji || ''}`,
                    alignment: 'center',
                  },
                  {
                    text: `${saju.pillars.hour?.gan || ''}\n${saju.pillars.hour?.ji || ''}`,
                    alignment: 'center',
                  },
                ],
              ],
            },
            margin: [0, 5, 0, 15],
          },
        ]
      : []),

    // Element counts
    {
      text: '오행 분포',
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    ...(saju.elementCounts
      ? [
          {
            ul: [
              `목(木): ${saju.elementCounts.WOOD?.toFixed(1) || 0}`,
              `화(火): ${saju.elementCounts.FIRE?.toFixed(1) || 0}`,
              `토(土): ${saju.elementCounts.EARTH?.toFixed(1) || 0}`,
              `금(金): ${saju.elementCounts.METAL?.toFixed(1) || 0}`,
              `수(水): ${saju.elementCounts.WATER?.toFixed(1) || 0}`,
            ],
            fontSize: 11,
            margin: [0, 5, 0, 10],
          },
        ]
      : []),

    // Yongsin
    {
      text: '용신 (用神)',
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    {
      text: `주 용신: ${yongsin.primary || '분석 중'}`,
      fontSize: 12,
      margin: [0, 5, 0, 0],
    },
    ...(yongsin.secondary
      ? [
          {
            text: `보조 용신: ${yongsin.secondary}`,
            fontSize: 12,
            margin: [0, 3, 0, 0],
          },
        ]
      : []),
  ];
}

function buildFooter() {
  return [
    { text: '', margin: [0, 30, 0, 0] },
    {
      text: '─────────────────────────────────────',
      alignment: 'center',
      color: '#cccccc',
    },
    { text: '', margin: [0, 10, 0, 0] },
    {
      text: '본 결과는 Saju Naming Platform에서 생성되었습니다',
      style: 'footer',
    },
    {
      text: '전문가의 조언과 함께 참고하시기 바랍니다',
      style: 'footer',
      margin: [0, 5, 0, 0],
    },
  ];
}
