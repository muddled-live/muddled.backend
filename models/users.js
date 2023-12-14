const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('users', {
        username: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        cursor: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
        {
            indexes: [
                {
                    unique: true,
                    fields: ['username']
                }
            ]
        },
    );
    return User;
};