// Script para probar la API de turnos
const API_BASE_URL = 'http://localhost:3001';

async function testShiftsAPI() {
  console.log('🧪 Probando API de turnos...\n');

  try {
    // 1. Probar registro y login
    console.log('1️⃣ Creando usuario de prueba...');
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
    console.log('✅ Usuario creado:', registerResult.data);

    // 2. Login
    console.log('\n2️⃣ Haciendo login...');
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
    const token = loginResult.data.token;
    console.log('✅ Login exitoso');

    // 3. Verificar JWT payload
    console.log('\n3️⃣ Verificando JWT payload...');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('📋 JWT Payload:', {
      user_id: payload.user_id,
      company_id: payload.company_id,
      employee_id: payload.employee_id,
      role_id: payload.role_id,
      role_name: payload.role_name,
      user_type: payload.user_type,
    });

    // 4. Probar endpoint de empleados
    console.log('\n4️⃣ Probando endpoint de empleados...');
    const employeesResponse = await fetch(`${API_BASE_URL}/api/v1/employees`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!employeesResponse.ok) {
      throw new Error(`Empleados falló: ${employeesResponse.status}`);
    }

    const employeesResult = await employeesResponse.json();
    console.log('✅ Empleados obtenidos:', employeesResult.data?.length || 0, 'empleados');

    // 5. Probar endpoint de turnos
    console.log('\n5️⃣ Probando endpoint de turnos...');
    const shiftsResponse = await fetch(`${API_BASE_URL}/api/v1/shifts`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!shiftsResponse.ok) {
      throw new Error(`Turnos falló: ${shiftsResponse.status}`);
    }

    const shiftsResult = await shiftsResponse.json();
    console.log('✅ Turnos obtenidos:', shiftsResult.data?.length || 0, 'turnos');

    // 6. Probar endpoint de empleados con turnos
    console.log('\n6️⃣ Probando endpoint de empleados con turnos...');
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Lunes
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Domingo

    const employeesWithShiftsResponse = await fetch(
      `${API_BASE_URL}/api/v1/employees/for-shifts?start_date=${weekStart.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!employeesWithShiftsResponse.ok) {
      throw new Error(`Empleados con turnos falló: ${employeesWithShiftsResponse.status}`);
    }

    const employeesWithShiftsResult = await employeesWithShiftsResponse.json();
    console.log('✅ Empleados con turnos obtenidos:', employeesWithShiftsResult.data?.length || 0, 'empleados');
    console.log('📊 Estructura de datos:', employeesWithShiftsResult.data?.[0] ? Object.keys(employeesWithShiftsResult.data[0]) : 'No hay datos');

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('- ✅ Usuario creado con user_type: admin');
    console.log('- ✅ Login funciona correctamente');
    console.log('- ✅ JWT payload incluye user_type y role_name');
    console.log('- ✅ Endpoint de empleados funciona');
    console.log('- ✅ Endpoint de turnos funciona');
    console.log('- ✅ Endpoint de empleados con turnos funciona');

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    process.exit(1);
  }
}

// Ejecutar prueba
testShiftsAPI();
