const http = require('http');
const async = require('async');

// Gets the Host Name and port arguments from the command line.
const hostName = process.argv[2];
const port = process.argv[3];

if (!hostName) {
    throw new Error('Host Name is required.');
}

if (!port) {
    throw new Error('Port is required.');
}

const url = `http://${hostName}:${port}`;
const users = [];

const server = http.createServer((req, res) => {
    // Handle GET /users
    if (req.method === 'GET' && req.url === '/users') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(users));
    }
    // Handle POST /users
    else if (req.method === 'POST' && req.url === '/users') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const user = JSON.parse(body);
                users.push(user);
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(user));
            } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(port, hostName, () => {
    console.log(`Server running at http://${hostName}:${port}/`);
});

const postUserRequest = (userId, callback) => {
    const data = JSON.stringify({
        user_id: userId
    });

    const options = {
        hostName,
        port,
        path: '/users',
        method: 'POST',
    };

    const req = http.request(options, (response) => {
        let data = '';

        // Accumulate data chunks
        response.on('data', (chunk) => {
            data += chunk;
        });

        // Process response on end
        response.on('end', () => {
            callback(null, JSON.parse(data));
        });

    }).on('error', (err) => {
        console.log(`Error: ${err.message}`);
    });

    req.write(data);
    req.end();
}

const getUsersRequest = (callback) => {
    const options = {
        hostName,
        port,
        path: '/users',
        method: 'GET',
    };

    const req = http.request(options, (response) => {
        let data = '';

        // A chunk of data has been received.
        response.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        response.on('end', () => {
            callback(null, JSON.parse(data));
        });

    }).on('error', (err) => {
        console.log('Error: ' + err.message);
    })

    req.end();
}

async.series({
    post: (callback) => {
        async.times(5, (n, next) => {
            postUserRequest(n + 1, (err, user) => {
                next(err, user);
            });
        }, (err, results) => {
            if (err) {
                throw new Error(err);
            }

            callback(null, null);
        });
    },
    get: (callback) => {
        getUsersRequest(callback);
    }
}, (err, results) => {
    if (err) {
        throw new Error(err);
    }

    console.log(results.get);
});


