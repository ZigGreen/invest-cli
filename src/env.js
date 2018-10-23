const { equals } = require('ramda');
const { Observable } = require('rxjs');
const { shareReplay } = require('rxjs/operators');
const { readFileSync } = require('fs');
const { resolve } = require('path');

function matchAll(str, regex) {
    const res = {};
    let m;
    if (regex.global) {
        while (m = regex.exec(str)) {
            const [, key, url, mock] = m;
            if (!res[key] && url.includes('https://')) {
                res[key] = { url, mock: Boolean(mock) }
            }
        }
    }

    return res;
}

function getEnv(path) {
    const env_text = readFileSync(path).toString();

    return matchAll(env_text, /\s*(.*_API): '(.*)',\s*(\/\/\s*mocked)?/g);
}

exports.default = Observable.create(observer => {
    const env_filepath = resolve(process.cwd(), 'server/env.js');
    const watcher = require('fsevents')(env_filepath);
    let env = getEnv(env_filepath);

    observer.next(env);
    watcher.on('change', (path, info) => {
        if (info.path !== env_filepath || info.type !== 'file') {
            return;
        }
        const newEnv = getEnv(env_filepath);
        if (equals(env, newEnv)) {
            return;
        }
        env = newEnv;
        observer.next(env);
    });

    watcher.start();
}).pipe(shareReplay(1));