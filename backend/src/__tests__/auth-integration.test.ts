import request from 'supertest';
import { app } from '../app';
import { prisma } from '../config/prisma_client';

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    // Limpiar base de datos antes de cada test
    await prisma.company_employee.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should create admin user with correct permissions', async () => {
      const registerData = {
        company_name: 'Test Company',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('company_id');
      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data).toHaveProperty('role_id');
      expect(response.body.data).toHaveProperty('employee_id');

      // Verificar que se creó el rol de admin
      const role = await prisma.role.findFirst({
        where: { company_id: response.body.data.company_id },
      });
      expect(role?.name).toBe('Admin');

      // Verificar que el empleado tiene el rol de admin
      const employee = await prisma.company_employee.findFirst({
        where: { id: response.body.data.employee_id },
        include: { role: true },
      });
      expect(employee?.role.name).toBe('Admin');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return JWT with correct user_type for admin', async () => {
      // Primero crear un usuario admin
      const registerData = {
        company_name: 'Test Company',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      // Luego hacer login
      const loginData = {
        email: 'john@test.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');

      // Decodificar JWT para verificar payload
      const token = response.body.data.token;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      expect(payload.user_type).toBe('admin');
      expect(payload.role_name).toBe('Admin');
    });
  });

  describe('Admin Middleware', () => {
    it('should allow access for admin user', async () => {
      // Crear usuario admin y obtener token
      const registerData = {
        company_name: 'Test Company',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@test.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(registerData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'john@test.com',
          password: 'password123',
        });

      const token = loginResponse.body.data.token;

      // Intentar acceder a endpoint protegido
      const response = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
