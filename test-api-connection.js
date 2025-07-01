// test-api-connection.js - Probar conexión API desde frontend
console.log('🧪 Testing API connection from frontend...');

// Simular la URL que usa el frontend
const API_BASE = 'https://admincomercial.onrender.com';

async function testAPI() {
  console.log('Testing base URL:', API_BASE);
  
  // Test 1: Health check
  try {
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log('Health Status:', healthResponse.status);
    console.log('Health Headers:', Object.fromEntries(healthResponse.headers));
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health data:', healthData);
    }
  } catch (error) {
    console.log('❌ Health error:', error.message);
  }

  // Test 2: CORS preflight
  try {
    console.log('\n2️⃣ Testing CORS with OPTIONS...');
    const corsResponse = await fetch(`${API_BASE}/api/auth/user-profile`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://fsuperadmin.vercel.app',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    });
    console.log('CORS Status:', corsResponse.status);
    console.log('CORS Headers:', Object.fromEntries(corsResponse.headers));
  } catch (error) {
    console.log('❌ CORS error:', error.message);
  }

  // Test 3: API endpoint
  try {
    console.log('\n3️⃣ Testing API endpoint...');
    const apiResponse = await fetch(`${API_BASE}/api/auth/user-profile`, {
      method: 'GET',
      headers: {
        'Origin': 'https://fsuperadmin.vercel.app',
        'Content-Type': 'application/json'
      }
    });
    console.log('API Status:', apiResponse.status);
    console.log('API Headers:', Object.fromEntries(apiResponse.headers));
    
    if (apiResponse.status === 401) {
      console.log('⚠️ 401 Unauthorized (expected without token)');
    } else {
      const text = await apiResponse.text();
      console.log('API Response:', text);
    }
  } catch (error) {
    console.log('❌ API error:', error.message);
  }
}

testAPI();
