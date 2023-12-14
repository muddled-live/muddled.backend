const axios = require('axios');
const moment = require('moment');

function extractVideoID(msg) {
    const youtubeRegex = /(?:(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11}))/i;
    const matches = msg.match(youtubeRegex);
    return matches ? matches[1] : '';
}

async function getMetadata(code) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;

        const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${code}&key=${apiKey}`, {
            headers: {
                Accept: 'application/json',
            },
        });

        if (response.status < 200 || response.status > 299) {
            const dataStr = JSON.stringify(response.data);
            throw new Error(`YouTube API returned ${response.status}, for '${code}' ${dataStr}`);
        }

        const vid = response.data.items[0];
        const viewCount = parseInt(vid.statistics.viewCount);
        const likeCount = parseInt(vid.statistics.likeCount);

        const duration = moment.duration(vid.contentDetails.duration);
        const totalSeconds = duration.asSeconds();

        return {
            code: code,
            url: `https://www.youtube.com/watch?v=${code}`,
            title: vid.snippet.title,
            thumbnail: vid.snippet.thumbnails.medium.url,
            publishedAt: moment(vid.snippet.publishedAt).format('YYYY-MM-DD HH:mm:ss'),
            viewCount: viewCount,
            likeCount: likeCount,
            duration: totalSeconds,
            channelName: vid.snippet.channelTitle,
            channelId: vid.snippet.channelId,
        };
    } catch (error) {
        throw new Error(`Error fetching videos for ${code}: ${error.message}`);
    }
}

module.exports = {
    extractVideoID,
    getMetadata,
};