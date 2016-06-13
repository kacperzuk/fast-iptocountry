"use strict";

const EventEmitter = require('events');
const sorted = require('sorted');
const byline = require('byline');
const fs = require('fs');
const ip = require('ip');
const http = require('http');
const zlib = require('zlib');
const csvparse = require('csv-parse');

const rawDbUrl = "http://software77.net/geo-ip/?DL=1";

const rawDbFilename = "iptocountry.csv";

const dbFilename = "db.txt";

let database = sorted();

// FIXME: recursion probably isn't the most efficient solution...
function _findInSortedRanges(db, ipLong, fromIndex, toIndex) {
  if(fromIndex > toIndex) return null; // not found :(

  let m = parseInt((fromIndex + toIndex) / 2);
  let a = db.get(m);

  if(a[0] < ipLong && a[1] < ipLong) {
    return _findInSortedRanges(db, ipLong, m+1, toIndex);
  } else if(a[0] > ipLong && a[1] > ipLong) {
    return _findInSortedRanges(db, ipLong, fromIndex, m-1);
  } else if(a[0] <= ipLong && a[1] >= ipLong) {
    return a;
  }

  throw new Error("BUG?");
}

function findInSortedRanges(db, ipv) {
  let iplong;
  if(typeof ipv == "string") {
    iplong = ip.toLong(ipv);
  } else {
    iplong = ipv;
  }

  return _findInSortedRanges(db, iplong, 0, db.length-1);
}

class IPtoCountry extends EventEmitter {
  constructor(cachedir) {
    super();
    this.cachedir = cachedir;

    // FIXME: should be async probably
    try {
      fs.mkdirSync(cachedir);
    } catch(e) {}
  }

  _load() {
    fs.readFile(this.cachedir + "/" + dbFilename, (err, data) => {
      if(err) throw err;
      database = sorted(JSON.parse(data), (aa,bb) => {
        let a = aa[0];
        let b = bb[0];
        if (a == b) return 0
        else if (a > b) return 1
        else if (a < b) return -1
        else throw new RangeError('Unstable comparison: ' + a + ' cmp ' + b)
      });
      this.emit("ready");
    });
  }

  _parseRawDb(callback) {
    let rstream = fs.createReadStream(this.cachedir + "/" + rawDbFilename)
      .pipe(csvparse({ comment: '#' }, (err, data) => {
        if(err) throw err;
        const db = data.map((row) => {
          const start = parseInt(row[0]);
          const end = parseInt(row[1]);
          const code = row[4];
          const country = row[6];
          return [start, end, { code, country } ];
        });
        db.sort((a, b) => {
          return a[0] - b[0];
        });
        fs.writeFile(this.cachedir + "/" + dbFilename, JSON.stringify(db), callback);
      }));
  }

  load(options) {
    if(!options) options = {};
    if(options.update) {
      // FIXME: make it parallel instead of sequential. promises maybe?
      // FIXME: unsafe when run from multiple processes
      /*http.get(rawDbUrl, (response) => {
        const writeStream = fs.createWriteStream(this.cachedir + "/" + rawDbFilename);
        const readStream = response.pipe(zlib.createGunzip());
        readStream.on("data", (data) => writeStream.write(data));
        readStream.on("end", () => {
          writeStream.close();*/
          this._parseRawDb(() => {
            this._load();
          });
        /*});
      });*/
    } else {
      this._load();
    }
  }

  lastUpdated(callback) {
    fs.stat(this.cachedir + "/" + dbFilename, (err, stat) => {
      let daysSinceUpdate;
      // FIXME: should check the error probably...
      if(err) daysSinceUpdate = Infinity;
      else {
        let msSinceUpdate = new Date() - new Date(stat.mtime);
        daysSinceUpdate = msSinceUpdate/1000/3600/24.0;
      }
      callback(null, daysSinceUpdate);
    });
  }

  lookup(ip) {
    let db = findInSortedRanges(database, ip);
    if(!db) return null;
    return db[2];
  }
}

module.exports = (cachedir) => {
  return new IPtoCountry(cachedir);
};
