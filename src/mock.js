const { Observable } = require('rxjs');
const { shareReplay } = require('rxjs/operators');
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const getUserHome = () => process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const filePath = resolve(getUserHome(), 'tinkoff.json');

try {
    writeFileSync(filePath, JSON.stringify({ mock: {} }), { flag: 'wx' });
} catch (e) {
}

function getMockData(path) {
    const str = readFileSync(path).toString();

    return JSON.parse(str).mock || {};
}

exports.default = Observable.create(observer => {
    const watcher = require('fsevents')(filePath);

    observer.next(getMockData(filePath));

    watcher.on('change', (path, info) => {
        if (info.path !== filePath || info.type !== 'file') {
            return;
        }

        observer.next(getMockData(filePath));
    });

    watcher.start();
}).pipe(shareReplay(1));
