// Script para validar la refactorización de autenticación
const API_BASE_URL = 'http://localhost:3001';

async function validateAuthRefactor() {
  console.log('🧪 Validando refactorización de autenticación...\n');

  try {
    // 1. Probar registro de nueva compañía
    console.log('1️⃣ Probando registro de nueva compañía...');
    const registerData = {
      company_name: `Test Company ${Date.now()}`,
      first_name: 'Test',
      last_name: 'Admin',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
    };

    const registerResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!registerResponse.ok) {
      throw new Error(`Registro falló: ${registerResponse.status}`);
    }

    const registerResult = await registerResponse.json();
    console.log('✅ Registro exitoso:', registerResult.data);

    // 2. Probar login
    console.log('\n2️⃣ Probando login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.email,
        password: registerData.password,
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falló: ${loginResponse.status}`);
    }

    const loginResult = await loginResponse.json();
    console.log('✅ Login exitoso');

    // 3. Verificar JWT payload
    console.log('\n3️⃣ Verificando JWT payload...');
    const token = loginResult.data.token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    console.log('📋 JWT Payload:', {
      user_id: payload.user_id,
      company_id: payload.company_id,
      employee_id: payload.employee_id,
      role_id: payload.role_id,
      role_name: payload.role_name,
      user_type: payload.user_type,
    });

    // Verificar que tiene los campos correctos
    if (!payload.user_type) {
      throw new Error('JWT payload no incluye user_type');
    }
    if (!payload.role_name) {
      throw new Error('JWT payload no incluye role_name');
    }
    if (payload.user_type !== 'admin') {
      throw new Error(`user_type incorrecto: ${payload.user_type}, esperado: admin`);
    }
    if (payload.role_name !== 'Admin') {
      throw new Error(`role_name incorrecto: ${payload.role_name}, esperado: Admin`);
    }

    console.log('✅ JWT payload correcto');

    // 4. Probar endpoint protegido
    console.log('\n4️⃣ Probando endpoint protegido...');
    const protectedResponse = await fetch(`${API_BASE_URL}/api/v1/employees`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!protectedResponse.ok) {
      throw new Error(`Endpoint protegido falló: ${protectedResponse.status}`);
    }

    console.log('✅ Acceso a endpoint protegido exitoso');

    console.log('\n🎉 ¡Validación completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Registro de compañía funciona');
    console.log('- ✅ Login funciona');
    console.log('- ✅ JWT payload incluye user_type y role_name');
    console.log('- ✅ Usuario registrado tiene permisos de admin');
    console.log('- ✅ Middleware de admin funciona correctamente');

  } catch (error) {
    console.error('❌ Error en validación:', error.message);
    process.exit(1);
  }
}

// Ejecutar validación
validateAuthRefactor();
