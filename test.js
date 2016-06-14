// you must pass a directory in which database will be saved
// if it doesn't exist, it will be created
const iptocountry = require("./index")("cache/");

// check when the database was updated
// t are days
// t is Infinity if there's no database at all
iptocountry.lastUpdated(function(err, t) {
  // update the database if it's older than 1 day
  // you must call .load() even if you don't update the database
  if (t > 31) {
    iptocountry.load({ update: true });
  } else {
    iptocountry.load();
  }
})

var arr = ['50.21.180.100',
  '50.22.180.100',
  '1.38.1.1',
  2733834241,
  '8.8.8.8',
  '127.0.0.1',
  'asd'
];

// cache_locked event is emitted if load({ update: true }) is called in
// parallel (even from or multiple processes)
iptocountry.on('cache_locked', function() {
  // assume another process is updating the cache
  // .load() will wait until cache is updated
  console.log("cache_locked");
  iptocountry.load();
});

// ready event is emitted when the database has been loaded
iptocountry.on("ready", function() {
  arr.forEach(function(ip) {
    console.log(ip, '-', iptocountry.lookup(ip));
  })
});
