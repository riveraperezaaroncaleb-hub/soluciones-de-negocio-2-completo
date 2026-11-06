'use strict';

require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Agendo disponible en http://localhost:${port}`);
  sequelize.authenticate()
    .then(() => console.log('Conexión a MySQL establecida'))
    .catch((error) => {
      console.error('MySQL no está disponible; el prototipo local sigue funcionando:', error.message);
    });
});
