const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test media upload functionality
async function testMediaUpload() {
  try {
    console.log('🧪 Testing media upload functionality...');

    // First, get authentication token (you'll need to login first)
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'testuser1761430312162@example.com', // Use the test user we just created
      password: 'test123'    // The password we set
    });

    const token = loginResponse.data.token;
    console.log('✅ Got authentication token:', token ? 'Token received' : 'No token');
    console.log('📄 Login response:', JSON.stringify(loginResponse.data, null, 2));

    // Get user's conversations to find a conversation ID
    const conversationsResponse = await axios.get('http://localhost:3000/api/conversations', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (conversationsResponse.data.data.length === 0) {
      console.log('❌ No conversations found. Please create a conversation first.');
      return;
    }

    const conversationId = conversationsResponse.data.data[0].id;
    console.log(`📱 Using conversation ID: ${conversationId}`);

    // Create a small test image file
    const testImagePath = path.join(__dirname, 'test-image.png');
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log('📸 Created test image file');

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData.append('caption', 'Test image upload');

    // Upload the file
    console.log('📤 Uploading file...');
    const uploadResponse = await axios.post(
      `http://localhost:3000/api/conversations/${conversationId}/upload-media`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        timeout: 30000
      }
    );

    console.log('✅ Upload successful!');
    console.log('📄 Response:', JSON.stringify(uploadResponse.data, null, 2));

    // Cleanup
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test file');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response) {
      console.error('📄 Error response:', error.response.data);
      console.error('📊 Status:', error.response.status);
    }
  }
}

// Run the test
testMediaUpload();