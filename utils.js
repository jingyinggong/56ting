const Crawler = require('crawler');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

class CrawlerForBook {
    constructor(bid, indexUrl, chapterUrl, startIndex = 0) {
        this.bid = bid;
        this.startIndex = startIndex;
        this.indexUrl = indexUrl;
        this.chapterUrl = chapterUrl;
        this.chapterCount = 0;
        this.REG_MA = /datas=\(FonHen_JieMa\(\'(.*)\'\)\.split/;
        this.mp3s = [];
        this.ERROR_DATA = [];
        this.DATA_PATH = './data/' + bid + '/';
        this.JSON_FILE_NAME = this.DATA_PATH + 'mp3s.json'
        this.JSON_FILE_NAME_ERROR = this.DATA_PATH + 'mp3s_error.json'
    }

    static get_page_index(str) {
        return str.match(/(\d+)\.html/)[1];
    }

    static writeJSON = function(filename, data) {
        fs.writeFile(path.resolve(filename), JSON.stringify(data), function(){
            console.log(`${filename} saved!`);
        });
    }

    static tidyName(str) {
      var d = str.match(/\d+/)[0];
      var x = '';
      switch(d.length) {
        case 1:
          x = '000' + d;
          break;
        case 2:
          x = '00' + d;
          break;
        case 3:
          x = '0' + d;
          break;
        default:
          x = d;
      }
      return str.replace(/\d+/, x);
    }

    static get_suffix(str) {
      const a = str.split('.');
      return a[a.length - 1];
    }

    static JIEMA(u) {
      var tArr = u.split("*");
      var str = '';
      for(var i = 1, n = tArr.length; i< n; i++){
        str += String.fromCharCode(tArr[i]);
      }
      return str;
    }

    getChapterUrls() {
        let q = [];
        for(let i = this.startIndex; i < this.chapterCount; i++) {
            q.push(this.chapterUrl.replace('BID', this.bid).replace('PID', i));
        }
        return q;
    }

    crawlIndex() {
        const c = new Crawler({
            maxConnections : 10,
            callback : (error, res, done)=> {
                if(error) {
                    console.log(error);
                } else {
                    const L = res.$('#vlink_1 ul li a').length;
                    this.chapterCount = L;
                }
                done();
            }
        });
        c.queue(this.indexUrl.replace('bid', this.bid));
        c.on('drain', ()=>{
            console.log('all list crawler done');
            this.crawChapter();
        });
        return c;
    }

    crawChapter() {
        const q = this.getChapterUrls();
        const c = new Crawler({
            maxConnections : 10,
            callback : (error, res, done)=> {
                let index = CrawlerForBook.get_page_index(res.options.uri);
                if(error) {
                    console.log(error);
                } else {
                    let x = res.body.match(this.REG_MA);
                    let str = x[1];
                    let u = CrawlerForBook.JIEMA(str).split('&')[0];
                    this.mp3s.push({
                        i: index,
                        uri: u
                    });

                }

            }
        });
        c.queue(q);
        c.on('drain',function(){
            console.log('all chapters crawler done');
            CrawlerForBook.writeJSON(this.JSON_FILE_NAME, this.mp3s);
        });
        return c;
    }

    crawlMp3() {
        let ERROR_DATA = this.ERROR_DATA;
        let metaData = this.mp3s;
        let counter = 0;
        let c = new Crawler({
            maxConnections : 6,
            jQuery: false,
            callback: (error, res, done)=> {
                let uri = res.options.uri;
                let x = chalk.green(`===== ${counter++} / ${metaData.length} ====`);
                console.log(x);
                if(error) {
                    console.error(error);
                    ERROR_DATA.push(res.options.i);
                } else {
                    try {
                      const filename = path.resolve(this.DATA_PATH, CrawlerForBook.tidyName(res.options.i)+ '.' + CrawlerForBook.get_suffix(uri));
                      fs.createWriteStream(filename).write(res.body);
                      console.log('mp3 file saved = ' + filename);
                    } catch(e) {
                        console.log('catchx ', e);
                        ERROR_DATA.push(index);
                    }
                }
                done();
            }
        });

        c.queue(this.mp3s);

        c.on('drain',function(){
            console.log('all mp3 crawler done');
            writeJSON(JSON_FILE_NAME_ERROR, ERROR_DATA);
        });

        return c;

    }
}

exports.CrawlerForBook = CrawlerForBook;
