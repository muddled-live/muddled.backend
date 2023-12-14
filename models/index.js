const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
);

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch((error) => {
    console.error('Unable to connect to the database: ', error);
});

const User = require('./users')(sequelize, Sequelize);
const Video = require('./videos')(sequelize, Sequelize);

async function forceSyncDB() {
    try {
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
}

module.exports = {
    User,
    Video,
    sequelize,
    forceSyncDB
};