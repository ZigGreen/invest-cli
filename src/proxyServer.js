const ramda = require('ramda');
const https = require('https');
const http = require('http');
const url = require('url');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});
let mockData;
let mockFn = (url, params, mock) => mock;
let responseMode;
let server = null;

const httpModes = {
    error: {
        statusCode: 202,
        status: 'Error'
    },
    success: {
        statusCode: 200,
        status: 'Ok'
    }
};
let env = null;

exports.startServer = ({ port = 5050, mode = 'success', env$, mock$ }) => {
    env$.subscribe(x => {
        env = x;
    });
    mock$.subscribe(x => {
        mockData = x;
    });
    responseMode = mode;

    function start() {
        server = http.createServer((req, res) => {
            mock(req, res, () => {
                const [,apiKey, ...params] = req.url.split('/');
                const { url: api } = env[apiKey] || {};
                const oldUrl = req.url;
                req.url = '/' + params.join('/');

                try {
                    proxy.web(req, res, {
                        agent: https.globalAgent,
                        headers: { host: url.parse(api).host },
                        target: api
                    })
                } catch (e) {
                    console.error(apiKey, oldUrl);
                    console.error(e);
                }


            });
        });

        server.listen(port);
    }

    if (server) {
        server.close(start);
    } else {
        start();
    }

};

exports.setMockData = function (data) {
    mockData = data;
};


function methodPath(url) {
    return url.split('?')[0].split('/').filter(x => x);
}

function getReqParams(request) {
    return new Promise(resolve => {
        if (request.method === 'POST') {
            let body = '';

            request.on('data', data => body += data);

            request.on('end', () => {
                try {
                    return resolve(JSON.parse(body));
                } catch (e) {
                    console.error(body);
                    resolve('');
                }
            });

        } else {
            resolve('');
        }
    });
}

function mock(request, response, next) {
    const result = ramda.path(methodPath(request.url), mockData);
    const [,apiKey] = request.url.split('/');
    const { mock } = env[apiKey] || {};

    if (!result || !mock) {
        next();
        return;
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Content-Type', 'application/json');

    if (request.method === 'OPTIONS') {
        response.writeHead(httpModes[responseMode].statusCode);
        response.end();
    } else {
        getReqParams(request).then(params => {
            response.writeHead(httpModes[responseMode].statusCode);
            response.end(JSON.stringify({
                payload: mockFn(request.url, params, result),
                status: httpModes[responseMode].status
            }))
        })
            .catch((e) => {
                console.error('getReqParams error', e)
            });
    }

    console.info(`info: ${request.url} has been proxied`);
}
