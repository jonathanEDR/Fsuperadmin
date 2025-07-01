// test-production-connection.js - Test production API connectivity
const backendUrl = 'https://admincomercial.onrender.com';
const frontendUrl = 'https://fsuperadmin.vercel.app';

console.log('🌐 Testing Production API Connectivity...\n');

async function testApiEndpoints() {
  const endpoints = [
    { name: 'Health Check', url: `${backendUrl}/api/health`, method: 'GET' },
    { name: 'Root Endpoint', url: `${backendUrl}/`, method: 'GET' },
    { name: 'Auth Profile (requires token)', url: `${backendUrl}/api/auth/user-profile`, method: 'GET' }
  ];

  console.log('📡 Testing backend endpoints:\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`🔄 Testing ${endpoint.name}...`);
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': frontendUrl
      };

      // For auth endpoint, we expect a 401 without token (which is normal)
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers,
        mode: 'cors'
      });

      if (endpoint.name.includes('Auth Profile')) {
        if (response.status === 401) {
          console.log(`  ✅ ${endpoint.name}: ${response.status} (Expected - requires auth token)`);
        } else {
          console.log(`  ⚠️  ${endpoint.name}: ${response.status} (Unexpected)`);
        }
      } else {
        if (response.ok) {
          console.log(`  ✅ ${endpoint.name}: ${response.status} - OK`);
        } else {
          console.log(`  ❌ ${endpoint.name}: ${response.status} - ${response.statusText}`);
        }
      }

      // Check CORS headers
      const corsHeaders = response.headers.get('access-control-allow-origin');
      if (corsHeaders) {
        console.log(`     CORS: ${corsHeaders}`);
      }

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('CORS')) {
        console.log(`  ❌ ${endpoint.name}: CORS Error - ${error.message}`);
      } else {
        console.log(`  ❌ ${endpoint.name}: ${error.message}`);
      }
    }
    console.log('');
  }
}

async function testCorsConfiguration() {
  console.log('🔒 Testing CORS Configuration...\n');
  
  try {
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });

    console.log(`OPTIONS request status: ${response.status}`);
    console.log('Response headers:');
    
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    }

  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
  }
}

// Run tests
(async () => {
  await testApiEndpoints();
  await testCorsConfiguration();
  
  console.log('\n📝 Summary:');
  console.log('  - Health check should return 200');
  console.log('  - Root endpoint should return 200');
  console.log('  - Auth endpoint should return 401 (needs token)');
  console.log('  - CORS should allow frontend origin');
  console.log('  - OPTIONS requests should work properly\n');
  
  console.log('🔗 Next: Test the actual login flow at:');
  console.log(`     ${frontendUrl}/login\n`);
})();
