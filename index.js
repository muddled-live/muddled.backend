require('dotenv').config();

const express = require('express');
const twitch = require('tmi.js');

const { Sequelize, DataTypes } = require("sequelize");
const { getMetadata, extractVideoID } = require('./youtube/youtube');
const { Video, User } = require('./models');

const app = express();
const port = 3001;

const twitchOptions = {
    options: {
        debug: true,
    },
    connection: {
        reconnect: true,
    },
    identity: {
        username: 'justinfan0735',
        password: '0durrdofx588ubjuiwzic7kp7mew53',
    },
    channels: ['atrioc', 'crimpsonsloper', 'ttlnow'],
};


const client = new twitch.Client(twitchOptions);
client.connect();


client.on('message', async (channel, userstate, message, self) => {
    if (self) return;

    try {
        console.log('Created a new record : ', message)
        let videoId = await extractVideoID(message);
        if (videoId) {
            const [user, created] = await User.findOrCreate({
                where: { username: channel.substring(1) },
                defaults: {
                    cursor: 0
                }
            });
            const exists = await Video.findOne({
                where: {
                    submittedTo: channel.substring(1),
                    code: videoId,
                    id: {
                        [Sequelize.Op.gt]: user.cursor
                    }
                },
            });

            if (!exists) {
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
        }

    } catch (error) {
        console.log(error)
    }
});

app.get('/submissions', async (req, res) => {
    const { channel, limit = 8, cursor, max_duration = 86400, min_duration = 0 } = req.query;
    let position = cursor

    if (!channel) {
        res.status(400).json({ error: 'Channel is required' });
    }

    try {
        const videos = await Video.findAll({
            where: {
                submittedTo: channel,
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

app.get('/load/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const [user, created] = await User.findOrCreate({
            where: { username: username },
            defaults: {
                cursor: 0
            }
        });
        const lastVideo = await Video.findAll({
            where: { submittedTo: username },
            order: [['id', 'DESC']],
            limit: 12
        });
        user.cursor = lastVideo[lastVideo.length - 1].id;
        user.save()

        console.log(lastVideo)

        res.status(200).json({
            message: `User ${username} updated/created successfully`,
            data: {
                cursor: lastVideo[0].id,
                submissionsList: lastVideo
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
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