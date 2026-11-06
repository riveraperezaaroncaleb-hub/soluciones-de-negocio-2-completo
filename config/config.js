require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'business_solutions',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};

module.exports = {
  development: common,
  test: { ...common, database: process.env.DB_TEST_NAME || 'business_solutions_test' },
  production: common,
};
