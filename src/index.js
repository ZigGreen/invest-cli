const { spawn } = require('child_process');
const { mapObjIndexed: map } = require('ramda');
const env$ = require('./env').default;
const mock$ = require('./mock').default;
const { first } = require('rxjs/operators');
const { startServer } = require('./proxyServer');


const start = env => {

    const subproc = spawn('npm', ['run', 'start:invest'], {
        detached: true,
        env: Object.assign({}, process.env, map((_, key) => 'http://localhost:5050/' + key + '/', env))
    });

    subproc.stdout.pipe(process.stdout);
    subproc.stderr.pipe(process.stderr);

    startServer({ env$, mock$ })

};

env$.pipe(first()).subscribe(start);
