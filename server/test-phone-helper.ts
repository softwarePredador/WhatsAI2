/**
 * Test Script for Phone Helper
 * 
 * Validates phone-helper.ts functions with various phone number formats:
 * - Brazilian numbers (with/without country code, with/without area code)
 * - International numbers (US, UK, generic)
 * - WhatsApp JIDs (individual, group, newsletter)
 * - Edge cases (invalid formats, too short, too long)
 */

import {
  validatePhone,
  formatPhone,
  parsePhone,
  getCountryCode,
  normalizeWhatsAppJid,
  extractPhoneFromJid,
  isGroupJid,
  isNewsletterJid,
  formatPhoneForDisplay
} from './src/utils/phone-helper';

console.log('🧪 Testing Phone Helper Functions\n');
console.log('='.repeat(60));

// Test 1: validatePhone
console.log('\n📋 Test 1: validatePhone()');
console.log('-'.repeat(60));
const testNumbers = [
  { input: '+5511999999999', country: undefined, expected: true },
  { input: '5511999999999', country: 'BR', expected: true }, // Precisa country hint
  { input: '11999999999', country: 'BR', expected: true },
  { input: '+14155552671', country: undefined, expected: true },
  { input: '+442071838750', country: undefined, expected: true },
  { input: 'invalid', country: undefined, expected: false },
  { input: '123', country: undefined, expected: false }
];

testNumbers.forEach(({ input, country, expected }) => {
  const result = validatePhone(input, country as any);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} validatePhone('${input}'${country ? `, '${country}'` : ''}) => ${result} (expected: ${expected})`);
});

// Test 2: formatPhone
console.log('\n📋 Test 2: formatPhone()');
console.log('-'.repeat(60));
const formatTests = [
  { input: '+5511999999999', format: 'E164' as const, country: undefined, expected: '+5511999999999' },
  { input: '11999999999', format: 'E164' as const, country: 'BR', expected: '+5511999999999' },
  { input: '+5511999999999', format: 'INTERNATIONAL' as const, country: undefined, expected: '+55 11 99999 9999' }, // Real format (espaços, sem traço)
  { input: '5511999999999', format: 'NATIONAL' as const, country: 'BR', expected: '(11) 99999-9999' },
  { input: '+14155552671', format: 'INTERNATIONAL' as const, country: undefined, expected: '+1 415 555 2671' } // Real format
];

formatTests.forEach(({ input, format, country, expected }) => {
  const result = formatPhone(input, format, country as any);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} formatPhone('${input}', '${format}'${country ? `, '${country}'` : ''}) => ${result} (expected: ${expected})`);
});

// Test 3: getCountryCode
console.log('\n📋 Test 3: getCountryCode()');
console.log('-'.repeat(60));
const countryTests = [
  { input: '+5511999999999', expected: 'BR' },
  { input: '+14155552671', expected: 'US' },
  { input: '+442071838750', expected: 'GB' },
  { input: '11999999999', country: 'BR', expected: 'BR' }
];

countryTests.forEach(({ input, country, expected }) => {
  const result = getCountryCode(input, country as any);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} getCountryCode('${input}'${country ? `, '${country}'` : ''}) => ${result} (expected: ${expected})`);
});

// Test 4: normalizeWhatsAppJid
console.log('\n📋 Test 4: normalizeWhatsAppJid()');
console.log('-'.repeat(60));
const jidTests = [
  { input: '+55 11 99999-9999', expected: '5511999999999@s.whatsapp.net' },
  { input: '11999999999', expected: '5511999999999@s.whatsapp.net' },
  { input: '5511999999999', expected: '5511999999999@s.whatsapp.net' },
  { input: '+5511999999999', expected: '5511999999999@s.whatsapp.net' },
  { input: '555180256535@s.whatsapp.net', expected: '555180256535@s.whatsapp.net' },
  { input: '120363164787189624@g.us', expected: '120363164787189624@g.us' },
  { input: '123456789@newsletter', expected: '123456789@newsletter' },
  { input: '+1 415-555-2671', expected: '14155552671@s.whatsapp.net' } // Agora correto
];

jidTests.forEach(({ input, expected }) => {
  const result = normalizeWhatsAppJid(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} normalizeWhatsAppJid('${input}') => ${result} (expected: ${expected})`);
});

// Test 5: extractPhoneFromJid
console.log('\n📋 Test 5: extractPhoneFromJid()');
console.log('-'.repeat(60));
const extractTests = [
  { input: '5511999999999@s.whatsapp.net', expected: '5511999999999' },
  { input: '120363164787189624@g.us', expected: '120363164787189624' },
  { input: '123456789@newsletter', expected: '123456789' }
];

extractTests.forEach(({ input, expected }) => {
  const result = extractPhoneFromJid(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} extractPhoneFromJid('${input}') => ${result} (expected: ${expected})`);
});

// Test 6: isGroupJid
console.log('\n📋 Test 6: isGroupJid()');
console.log('-'.repeat(60));
const groupTests = [
  { input: '120363164787189624@g.us', expected: true },
  { input: '5511999999999@s.whatsapp.net', expected: false },
  { input: '123456789@newsletter', expected: false }
];

groupTests.forEach(({ input, expected }) => {
  const result = isGroupJid(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} isGroupJid('${input}') => ${result} (expected: ${expected})`);
});

// Test 7: isNewsletterJid
console.log('\n📋 Test 7: isNewsletterJid()');
console.log('-'.repeat(60));
const newsletterTests = [
  { input: '123456789@newsletter', expected: true },
  { input: '5511999999999@s.whatsapp.net', expected: false },
  { input: '120363164787189624@g.us', expected: false }
];

newsletterTests.forEach(({ input, expected }) => {
  const result = isNewsletterJid(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} isNewsletterJid('${input}') => ${result} (expected: ${expected})`);
});

// Test 8: formatPhoneForDisplay
console.log('\n📋 Test 8: formatPhoneForDisplay()');
console.log('-'.repeat(60));
const displayTests = [
  { input: '5511999999999@s.whatsapp.net', format: 'INTERNATIONAL' as const, expected: '+55 11 99999 9999' }, // Real format
  { input: '+5511999999999', format: 'NATIONAL' as const, expected: '(11) 99999-9999' },
  { input: '14155552671@s.whatsapp.net', format: 'INTERNATIONAL' as const, expected: '+1 415 555 2671' } // Real format
];

displayTests.forEach(({ input, format, expected }) => {
  const result = formatPhoneForDisplay(input, format);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} formatPhoneForDisplay('${input}', '${format}') => ${result} (expected: ${expected})`);
});

// Test 9: parsePhone (detailed information)
console.log('\n📋 Test 9: parsePhone() - Detailed Information');
console.log('-'.repeat(60));
const parseTests = [
  '+5511999999999',
  '+14155552671',
  '+442071838750'
];

parseTests.forEach(input => {
  const result = parsePhone(input);
  console.log(`\nparsePhone('${input}'):`);
  if (result) {
    console.log(`  Country: ${result.country}`);
    console.log(`  National Number: ${result.nationalNumber}`);
    console.log(`  Country Calling Code: ${result.countryCallingCode}`);
    console.log(`  E.164: ${result.format('E.164')}`);
    console.log(`  International: ${result.formatInternational()}`);
    console.log(`  National: ${result.formatNational()}`);
  } else {
    console.log('  ❌ Failed to parse');
  }
});

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!\n');
