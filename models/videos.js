const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
    const Video = sequelize.define('videos', {
        code: {
            type: DataTypes.STRING,
            allowNull: false
        },
        thumbnail: {
            type: DataTypes.STRING,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        viewCount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        likeCount: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        channelName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        submittedBy: {
            type: DataTypes.STRING,
            allowNull: false
        },
        submittedTo: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });
    return Video;
};