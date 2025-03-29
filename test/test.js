const request = require('supertest');
const app = require('../src/app');
const { User, Availability, Appointment } = require('../src/models');
const { describe, beforeAll, afterAll, test, expect } = require('@jest/globals');

// Rest of your test code remains the same
describe('College Appointment System API', () => {
  let studentToken;
  let professorToken;
  let adminToken;
  let availabilityId;
  let appointmentId;

  // Test data
  const testUsers = {
    student: {

      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    },
    professor: {
      name: 'Test Professor',
      email: 'professor@test.com',
      password: 'password123',
      role: 'professor'
    },
    admin: {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    }
  };

  const testAvailability = {
    startTime: '2023-12-01T09:00:00Z',
    endTime: '2023-12-01T17:00:00Z'
  };

  beforeAll(async () => {
    // Clear database
    await User.deleteMany({});
    await Availability.deleteMany({});
    await Appointment.deleteMany({});

    // Register test users
    await request(app).post('/api/auth/register').send(testUsers.student);
    await request(app).post('/api/auth/register').send(testUsers.professor);
    await request(app).post('/api/auth/register').send(testUsers.admin);

    // Login and get tokens
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.student.email,
        password: testUsers.student.password
      });
    studentToken = studentRes.body.token;

    const professorRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.professor.email,
        password: testUsers.professor.password
      });
    professorToken = professorRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.admin.email,
        password: testUsers.admin.password
      });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Availability.deleteMany({});
    await Appointment.deleteMany({});
  });

  describe('Authentication', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          password: 'password123',
          role: 'student'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    test('should not register with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUsers.student);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: testUsers.student.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.student.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Availability Management', () => {
    test('should allow professor to create availability', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${professorToken}`)
        .send(testAvailability);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      availabilityId = res.body._id;
    });

    test('should not allow student to create availability', async () => {
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(testAvailability);
      
      expect(res.statusCode).toBe(403);
    });

    test('should get availabilities for professor', async () => {
      const res = await request(app)
        .get(`/api/availability/professor/${testUsers.professor.email}`)
        .set('Authorization', `Bearer ${professorToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('should allow professor to delete availability', async () => {
      const res = await request(app)
        .delete(`/api/availability/${availabilityId}`)
        .set('Authorization', `Bearer ${professorToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Appointment Management', () => {
    beforeAll(async () => {
      // Create availability for appointment tests
      const res = await request(app)
        .post('/api/availability')
        .set('Authorization', `Bearer ${professorToken}`)
        .send(testAvailability);
      availabilityId = res.body._id;
    });

    test('should allow student to book appointment', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          professor: testUsers.professor.email,
          time: '2023-12-01T10:00:00Z'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      appointmentId = res.body._id;
    });

    test('should not allow booking outside availability window', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          professor: testUsers.professor.email,
          time: '2023-12-01T08:00:00Z' // Before availability
        });
      
      expect(res.statusCode).toBe(400);
    });

    test('should show appointments for student', async () => {
      const res = await request(app)
        .get(`/api/appointments/student/${testUsers.student.email}`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    test('should allow professor to cancel appointment', async () => {
      const res = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${professorToken}`);
      
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Admin Functionality', () => {
    test('should allow admin to view all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // 3 test users
    });

    test('should allow admin to delete any user', async () => {
      // Create a temporary user
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Temp User',
          email: 'temp@test.com',
          password: 'password123',
          role: 'student'
        });

      // Get the user ID
      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const tempUser = usersRes.body.find(u => u.email === 'temp@test.com');

      // Delete the user
      const deleteRes = await request(app)
        .delete(`/api/users/${tempUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteRes.statusCode).toBe(200);
    });
  });
});