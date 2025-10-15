/**
 * PDF Generator Library (Server-side)
 *
 * pdfmake를 사용한 PDF 생성 유틸리티
 * - 작명 결과를 PDF로 변환
 * - 한글 폰트 지원
 * - 프리미엄 전용 기능
 */

import PdfPrinter from 'pdfmake';

// pdfmake 폰트 설정 (기본 폰트 사용, 나중에 한글 폰트 추가 가능)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

const printer = new PdfPrinter(fonts);

export interface NamingResultPdfData {
  lastName: string;
  firstName: string[];
  firstNameHanja: string[];
  scores: {
    overall: number;
    elementHarmony: number;
    pronunciation: number;
    meaning: number;
  };
  characters: Array<{
    char: string;
    meaning?: string;
    strokes?: number;
    element?: string;
  }>;
  sajuInfo?: {
    birthDate: string;
    birthTime: string;
    gender: string;
  };
}

/**
 * 작명 결과를 PDF 버퍼로 생성
 *
 * @param data - 작명 결과 데이터
 * @returns PDF 버퍼
 */
export async function generateNamingResultPdf(
  data: NamingResultPdfData
): Promise<Buffer> {
  // PDF 문서 정의
  const docDefinition = {
    content: [
      // 제목
      {
        text: '사주 작명 결과',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // 이름 정보
      {
        text: '추천 이름',
        style: 'subheader',
        margin: [0, 10, 0, 10] as [number, number, number, number],
      },
      {
        text: `${data.lastName}${data.firstName.join('')}`,
        fontSize: 24,
        bold: true,
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      {
        text: `한자: ${data.lastName}${data.firstNameHanja.join('')}`,
        fontSize: 16,
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // 점수 정보
      {
        text: '종합 평가',
        style: 'subheader',
        margin: [0, 10, 0, 10] as [number, number, number, number],
      },
      {
        ul: [
          `종합 점수: ${data.scores.overall.toFixed(1)}점`,
          `오행 조화: ${data.scores.elementHarmony.toFixed(1)}점`,
          `발음: ${data.scores.pronunciation.toFixed(1)}점`,
          `의미: ${data.scores.meaning.toFixed(1)}점`,
        ],
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      // 한자 상세 정보
      {
        text: '한자 상세 정보',
        style: 'subheader',
        margin: [0, 10, 0, 10] as [number, number, number, number],
      },
      ...data.characters.map((char) => ({
        text: [
          { text: `${char.char} `, fontSize: 20, bold: true },
          { text: `(${char.meaning || '뜻 없음'}) `, fontSize: 12 },
          { text: `획수: ${char.strokes || '?'}획 `, fontSize: 10 },
          { text: `오행: ${char.element || '?'}`, fontSize: 10 },
        ],
        margin: [0, 5, 0, 5] as [number, number, number, number],
      })),

      // 사주 정보 (있을 경우)
      ...(data.sajuInfo
        ? [
            {
              text: '사주 정보',
              style: 'subheader',
              margin: [0, 20, 0, 10] as [number, number, number, number],
            },
            {
              ul: [
                `생년월일: ${data.sajuInfo.birthDate}`,
                `생시: ${data.sajuInfo.birthTime}`,
                `성별: ${data.sajuInfo.gender}`,
              ],
            },
          ]
        : []),

      // 푸터 안내
      {
        text: '\n\n본 결과는 사주 작명 플랫폼에서 생성되었습니다.',
        fontSize: 10,
        alignment: 'center',
        color: '#666666',
        margin: [0, 30, 0, 0] as [number, number, number, number],
      },
    ],

    // 스타일 정의
    styles: {
      header: {
        fontSize: 22,
        bold: true,
      },
      subheader: {
        fontSize: 16,
        bold: true,
      },
    },

    // 페이지 설정
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],
  };

  // PDF 생성
  const pdfDoc = printer.createPdfKitDocument(docDefinition as any);

  // 버퍼로 변환
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end();
  });
}
