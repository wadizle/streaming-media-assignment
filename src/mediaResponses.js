const fs = require('fs');
const path = require('path');

//I'm not sure I love the way I split the functions but it works decently
const getPositions = (request, stats) => {
    let { range } = request.headers;

    if (!range) {
      range = 'bytes=0-';
    }

    const positions = range.replace(/bytes=/, '').split('-');

    let start = parseInt(positions[0], 10);

    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    if (start > end) {
      start = end - 1;
    }

    return {
        start : start,
        end : end,
        total : total,
    };
};

const createHeadObject = (response, start, end, total, chunksize, contentType) => {
    return {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
};

const createStream = (file, start, end, response) => {
    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
};

const loadFile = (request, response, filePath, contentType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    let positions = getPositions(request, stats);
    let start = positions.start;
    let end = positions.end;
    let total = positions.total;
    const chunksize = (end - start) + 1;

    response.writeHead(206, createHeadObject(response, start, end, total, chunksize, contentType));

    return createStream(file, start, end, response);
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports.getParty = getParty;
module.exports.getBling = getBling;
module.exports.getBird = getBird;
