// Teste de normalização brasileira
function testNormalization() {
  // Simular a lógica da função normalizeWhatsAppNumber
  function normalizeBrazilian(cleanNumber) {
    if (cleanNumber.startsWith('55')) {
      const withoutCountry = cleanNumber.substring(2);

      if (withoutCountry.length === 8) {
        // 8 dígitos - assumir DDD 11 + adicionar 9º dígito
        const phone = withoutCountry;
        return `55119${phone}`;
      } else if (withoutCountry.length === 9) {
        // 9 dígitos (DDD + 8) - adicionar 9º dígito
        const ddd = withoutCountry.substring(0, 2);
        const phone = withoutCountry.substring(2);
        return `55${ddd}9${phone}`;
      } else if (withoutCountry.length === 10) {
        // 10 dígitos (DDD + 9) - manter como está
        return cleanNumber;
      }
    }
    return cleanNumber;
  }

  console.log('🧪 Testando normalização brasileira:');

  // Hipótese: números do usuário representam DDDs diferentes
  // 99118898909 = DDD 99 + telefone 11888909 (com 9º dígito)
  // 91188909 = DDD 11 + telefone 11888909 (sem 9º dígito)

  const testCases = [
    { input: '5599118898909', description: 'DDD 99 + 9º dígito + telefone' },
    { input: '55111888909', description: 'DDD 11 + telefone sem 9º dígito' },
    { input: '5511888909', description: '9 dígitos: DDD 11 + 8 dígitos telefone' },
    { input: '55911888909', description: 'DDD 99 + telefone sem 9º dígito' },
  ];

  testCases.forEach(({ input, description }) => {
    const result = normalizeBrazilian(input);
    console.log(`${input} (${description}) → ${result}`);
  });

  console.log('\n🎯 Resultado esperado para evitar duplicatas:');
  console.log('Ambos devem resultar no mesmo número normalizado');
}

testNormalization();