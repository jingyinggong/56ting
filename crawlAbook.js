const utils = require('./utils');

const { CrawlerForBook } = utils;

const INDEX_URL = "http://www.ting56.com/mp3/BID.html";
const CHAPTER_URL = "http://www.ting56.com/video/BID-0-PID.html";

const book = new CrawlerForBook('19236',  INDEX_URL, CHAPTER_URL, 0);

book.crawlIndex();
