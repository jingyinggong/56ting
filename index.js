const Crawler = require('crawler');
const path = require('path');
const fs = require('fs');

const DATA_PATH = './data/';

const ERROR_DATA = [];

const JSON_FILE_NAME = `${DATA_PATH}list.json`;
const JSON_FILE_NAME_ERROR = `${DATA_PATH}list_error.json`;

const LIST = require(JSON_FILE_NAME);

const writeJSON = function(filename, data) {
    fs.writeFile(path.resolve(filename), JSON.stringify(data), function(){
        console.log(`${filename} saved!`);
    });
}

const getAQueue = function(data) {
    return data.map(item=>{
        return {
            uri: item.u,
            name: item.i
        }
    });
}

const initCrawler = function(queue) {
    var c = new Crawler({
        maxConnections : 5,
        encoding: null,
        jQuery: false,// set false to suppress warning message.
        callback: function(err, res, done){
            const a = res.options.uri.split('.');
            const suffix = '.' + a[a.length - 1];
            console.log(`===============`);
            console.log(`index = ${res.options.name}`);
            const filename = path.resolve(__dirname, DATA_PATH, res.options.name + suffix);
            console.log(filename)
            if(err){
                console.error(err.stack);
                ERROR_DATA.push(res.options.name);
            } else {
                fs.createWriteStream(filename).write(res.body);
            }
            done();
        }
    });

    c.queue(queue);

    c.on('drain',function(){
        console.log('crawler done');
        writeJSON(JSON_FILE_NAME_ERROR, ERROR_DATA);
    });

    return c;
}

const Q = getAQueue(LIST);

initCrawler(Q);

