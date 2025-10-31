const axios = require('axios');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function analyzeAudioFile() {
  const prisma = new PrismaClient();

  try {
    // Get the full URL from database
    const audioMessage = await prisma.message.findFirst({
      where: { messageType: 'AUDIO' },
      select: { mediaUrl: true, id: true }
    });

    if (!audioMessage?.mediaUrl) {
      console.log('❌ No audio message found in database');
      return;
    }

    const audioUrl = audioMessage.mediaUrl;
    console.log('🔍 Analyzing audio file:', audioUrl);
    console.log('📝 Message ID:', audioMessage.id);

    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const buffer = Buffer.from(response.data);
    console.log('📏 File size:', buffer.length, 'bytes');
    console.log('🏷️ Content-Type:', response.headers['content-type']);

    // Check the first 32 bytes to see the file signature
    const header = buffer.subarray(0, 32);
    console.log('🔢 First 32 bytes (hex):', header.toString('hex'));
    console.log('🔢 First 32 bytes (ascii):', header.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));

    // Check for common audio signatures
    const signatures = {
      'MP3': ['494433', 'FFFB', 'FFF3', 'FFE3'], // ID3, MP3 frames
      'OGG': ['4F676753'], // OggS
      'WAV': ['52494646'], // RIFF
      'AAC': ['FFF1', 'FFF9'], // AAC ADTS
      'M4A': ['00000020', '00000018'], // MP4
      'OPUS': ['4F70757348656164'] // OpusHead
    };

    const first4 = buffer.subarray(0, 4).toString('hex');
    const first8 = buffer.subarray(0, 8).toString('hex');

    console.log('\n🔍 Signature analysis:');
    let detectedFormat = 'Unknown';
    for (const [format, sigs] of Object.entries(signatures)) {
      for (const sig of sigs) {
        if (first4.startsWith(sig) || first8.startsWith(sig)) {
          console.log(`✅ Detected ${format} signature: ${sig}`);
          detectedFormat = format;
        }
      }
    }

    console.log(`🎵 Detected format: ${detectedFormat}`);

    // Save a small sample for inspection
    const sampleFile = './audio-sample.bin';
    fs.writeFileSync(sampleFile, buffer.subarray(0, 1024));
    console.log(`💾 Saved first 1KB sample to ${sampleFile}`);

  } catch (error) {
    console.error('❌ Error analyzing audio file:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Headers:', error.response.headers);
    }
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAudioFile();