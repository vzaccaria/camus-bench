#!/usr/bin/env node
/* eslint quotes: [0], strict: [0] */
"use strict";

var _require = require("zaccaria-cli");

var $d = _require.$d;
var $o = _require.$o;
var $f = _require.$f;
var _ = _require._;
var $fs = _require.$fs;
var $b
// $r.stdin() -> Promise  ;; to read from stdin
= _require.$b;

var R = require("ramda");
var debug = require("debug")("camus-bench");

function perr(m) {
    console.log("Error: " + m);
}

var agent = require("./lib/agent");

var getOptions = function (doc) {
    "use strict";
    var o = $d(doc);
    var help = $o("-h", "--help", false, o);
    var useDistribution = o.distribution;
    var computeServiceTime = o["service-time"];
    var collect = o.collect;
    var lambda = parseFloat($o("-l", "--lambda", 1, o));
    var type = $o("-t", "--type", "fixed", o);
    var url = $o("-e", "--endpoint", undefined, o);
    var data = $o("-d", "--datafile", undefined, o);
    var tag = $o("-g", "--tag", undefined, o);
    var num = $o("-n", "--num", 10, o);

    return {
        help: help, useDistribution: useDistribution, computeServiceTime: computeServiceTime, collect: collect, lambda: lambda, type: type, url: url, data: data, tag: tag, num: num
    };
};

function measureRequest(opts, payload) {
    var startTime = process.hrtime();
    var type = opts.type;
    var tag = opts.tag;
    var lambda = opts.lambda;

    return agent.get(opts.url).end().then(function () {
        var responseTime = process.hrtime(startTime);
        var success = true;
        return { type: type, tag: tag, lambda: lambda, responseTime: responseTime, success: success };
    })["catch"](function () {
        var success = false;
        var responseTime = 0;
        return { type: type, tag: tag, lambda: lambda, responseTime: responseTime, success: success };
    });
}

function processFixed(opts, payload) {
    var lambda = opts.lambda;
    var num = opts.num;

    var times = _.map(_.range(0, num), function () {
        return 1 / lambda;
    });
    debug(times);
    times = R.scan(R.add, 1, times);
    debug(times);
    return $b.map(times, function (time) {
        return $b.delay(time * 1000).then(function () {
            return measureRequest(opts, payload);
        });
    });
}

var main = function () {
    $f.readLocal("docs/usage.md").then(function (it) {
        var opts = getOptions(it);
        debug(opts);
        var help = opts.help;
        var data = opts.data;
        var tag = opts.tag;
        var type = opts.type;

        if (help) {
            console.log(it);
        } else {
            $fs.readFileAsync(data, "utf8").then(function (dta) {
                dta = JSON.parse(dta);
                var res = _.find(dta, function (e) {
                    return e.tag === tag;
                });
                if (_.isUndefined(res)) {
                    perr("cant find object key " + tag + " in " + data);
                    process.exit(0);
                } else {
                    var payload = res.payload;
                    if (type === "fixed") {
                        processFixed(opts, payload).then(function (it) {
                            console.log(JSON.stringify(it, 0, 4));
                        });
                    }
                }
            });
        }
    });
};

main();
