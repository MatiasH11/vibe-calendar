import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma_client';

jest.setTimeout(30000);

describe('E2E: Auth, Roles, Employees', () => {
  const unique = Date.now();
  const adminEmail = `admin+${unique}@example.com`;
  const adminPassword = 'Chatwoot1!';
  const companyName = `TestCo-${unique}`;

  let bearerToken: string = '';
  let createdRoleId: number = 0;

  it('registers company and admin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        company_name: companyName,
        first_name: 'Matias',
        last_name: 'Hidalgo',
        email: adminEmail,
        password: adminPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.company_id).toBeDefined();
  });

  it('logs in admin and returns token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    bearerToken = res.body.data.token;
  });

  it('creates a role', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({ name: `Role-${unique}`, description: 'Test role' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    createdRoleId = res.body.data.id;
  });

  it('lists roles', async () => {
    const res = await request(app)
      .get('/api/v1/roles')
      .set('Authorization', `Bearer ${bearerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((r: any) => r.id === createdRoleId)).toBe(true);
  });

  it('adds an employee', async () => {
    const res = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', `Bearer ${bearerToken}`)
      .send({
        email: `emp+${unique}@example.com`,
        first_name: 'Emp',
        last_name: 'One',
        role_id: createdRoleId,
        position: 'Staff',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
  });

  it('lists employees', async () => {
    const res = await request(app)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${bearerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});


