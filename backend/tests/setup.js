process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-secret-test-secret-test-secret-123';
process.env.BCRYPT_ROUNDS = '4';
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '5';
process.env.DATABASE_URL ||= 'postgresql://taskorbit:taskorbit@localhost:5432/taskorbit_test?schema=public';
