# fast-iptocountry

Node.JS module for getting GeoLocation for a given IP address focused on
performance. It uses database from http://software77.net/geo-ip/ , which is a
Donationware (read more here: http://software77.net/geo-ip/?license ) .

## Installation

`npm install --save fast-iptocountry

## Description

This module downloads a CSV database of IP to Country mapping (~12MB) from
http://software77.net/geo-ip/ and converts it into a more useful format
(~10MB) that allows for a quick binary search. It will require about 21MB of
disk space and about 80MB of memory.

## Usage

```javascript
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

// ready event is emitted when the database has been loaded
iptocountry.on("ready", function() {
  arr.forEach(function(ip) {
    console.log(ip, '-', iptocountry.lookup(ip));
  })
});
```

Result of this sample script:

```
50.21.180.100 - { code: 'US', country: 'United States' }
50.22.180.100 - { code: 'US', country: 'United States' }
1.38.1.1 - { code: 'IN', country: 'India' }
2733834241 '-' { code: 'US', country: 'United States' }
8.8.8.8 - { code: 'US', country: 'United States' }
127.0.0.1 - { code: 'ZZ', country: 'Reserved' }
asd - { code: 'ZZ', country: 'Reserved' }
```

## TODO

* IPv6 not even tested...
* Memory usage is high
* Benchmarking
* Proper tests
