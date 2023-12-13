require('dotenv').config();

const express = require('express');
const twitch = require('tmi.js');

const { Sequelize, DataTypes } = require("sequelize");
const { getMetadata, extractVideoID } = require('./youtube/youtube');

const app = express();
const port = 3001;

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

const User = sequelize.define("users", {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
});

const Video = sequelize.define("videos", {
    code: DataTypes.STRING,
    url: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    title: DataTypes.STRING,
    viewCount: DataTypes.INTEGER,
    likeCount: DataTypes.STRING,
    publishedAt: DataTypes.DATE,
    duration: DataTypes.INTEGER,
    channel: DataTypes.STRING,
    channelId: DataTypes.STRING,
    submittedBy: DataTypes.STRING,
    submittedTo: DataTypes.STRING,
});

sequelize.sync().then(() => {
    console.log('Book table created successfully!');
}).catch((error) => {
    console.error('Unable to create table : ', error);
});


const twitchOptions = {
    options: {
        debug: false,
    },
    connection: {
        reconnect: true,
    },
    identity: {
        username: 'justinfan0735',
        password: '0durrdofx588ubjuiwzic7kp7mew53',
    },
    channels: ['crimpsonsloper'],
};



// Connect to Twitch chat
const client = new twitch.Client(twitchOptions);
client.connect();

// WebSocket setup for Twitch chat
client.on('message', async (channel, userstate, message, self) => {
    if (self) return;

    try {
        let videoId = await extractVideoID(message);
        if (videoId) {
            let newVid = await getMetadata(videoId);
            Video.create({
                ...newVid,
                submittedTo: channel.substring(1),
                submittedBy: userstate.username
            }).then(res => {
                console.log('Created a new record : ')
            }).catch((error) => {
                console.error('Failed to create a new record : ', error);
            });
        }

    } catch (error) {
        console.log(error)
    }
});

app.get('/part/:channel', (req, res) => {
    const { channel } = req.params;

    if (client.channels.includes(channel)) {
        client.part(channel)
            .then(() => {
                res.status(200).json({ message: `Successfully parted ${channel}` });
            })
            .catch((err) => {
                res.status(500).json({ error: `Error parting ${channel}: ${err}` });
            });
    } else {
        res.status(400).json({ message: `Channel ${channel} hasnt joined` });
    }
});

app.get('/submissions', async (req, res) => {
    const { channel, limit = 15, cursor, max_duration = 86400, min_duration = 0 } = req.query;
    let position = cursor;

    console.log(req.url)

    if (!channel) {
        res.status(400).json({ error: 'Channel is required' });
    }

    try {
        if (!client.channels.includes(channel)) {
            await client.join(channel);
        }

        if (!cursor) {
            const lastVideo = await Video.findOne({
                where: { submittedTo: channel },
            });
            position = lastVideo.id
        }

        console.log(position)

        const videos = await Video.findAll({
            where: {
                submittedTo: channel,
                duration: {
                    [Sequelize.Op.gt]: Number(min_duration),
                    [Sequelize.Op.lt]: Number(max_duration),
                },
                id: {
                    [Sequelize.Op.gt]: Number(position)
                }
            },
            order: [['id', 'ASC']],
            limit: Number(limit),
        });

        if (videos.length > 0) {
            position = videos[videos.length - 1].id
        }

        res.status(200).json({
            message: `Successfully joined ${channel}`,
            data: {
                cursor: position,
                submissionsList: videos,
            }
        });
    } catch (error) {
        console.error(`Error fetching videos for ${channel}: ${error}`);
        res.status(500).json({ error: `Error fetching videos for ${channel}: ${error.message}` });
    }
});



app.get('/join/:channel', (req, res) => {
    const { channel } = req.params;

    if (!client.channels.includes(channel)) {
        client.join(channel)
            .then(() => {
                res.status(200).json({ message: `Successfully joined ${channel}` });
            })
            .catch((err) => {
                res.status(500).json({ error: `Error joining ${channel}: ${err}` });
            });
    } else {
        res.status(400).json({ message: `Channel ${channel} already joined` });
    }
});

app.get('/mute/:channel/:member', (req, res) => {
    const { channel, member } = req.params;

    res.status(200).json({ message: `${channel}: ${member}` });
});

app.get('/like/:channel/:video', (req, res) => {
    const { channel, video } = req.params;

    res.status(200).json({ message: `${channel}: ${video}` });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}s`);
});