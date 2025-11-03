import { KOREAN_SURNAMES_DATA } from '../app/lib/korean-surnames.data';

/**
 * Extract all unique hanja characters from Korean surnames data
 */
function extractUniqueSurnameHanja(): string[] {
  const allHanja = KOREAN_SURNAMES_DATA.flatMap(item => item.hanja);

  // Handle compound surnames (南宮, 鮮于)
  const expandedHanja: string[] = [];
  for (const hanja of allHanja) {
    if (hanja.length > 1) {
      // Split compound surname into individual characters
      expandedHanja.push(...hanja.split(''));
    } else {
      expandedHanja.push(hanja);
    }
  }

  const uniqueHanja = [...new Set(expandedHanja)];
  return uniqueHanja.sort();
}

const surnameHanja = extractUniqueSurnameHanja();

console.log('='.repeat(60));
console.log('KOREAN SURNAME HANJA EXTRACTION');
console.log('='.repeat(60));
console.log(`Total unique hanja: ${surnameHanja.length}`);
console.log('\nAll surname hanja (one per line for SQL):');
console.log(surnameHanja.join('\n'));
console.log('\nSQL-ready format (comma-separated with quotes):');
console.log(surnameHanja.map(h => `'${h}'`).join(', '));
console.log('\nArray format for JavaScript:');
console.log(JSON.stringify(surnameHanja, null, 2));
