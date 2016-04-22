#!/usr/bin/env node
/* eslint quotes: [0], strict: [0] */
"use strict";

var _require = require("zaccaria-cli");

var $d = _require.$d;
var $o = _require.$o;
var $f = _require.$f;
var _ = _require._;
var $fs
// $r.stdin() -> Promise  ;; to read from stdin
= _require.$fs;

var $b = require("bluebird");
var R = require("ramda");
var debug = require("debug")("camus-bench");
var PD = require("probability-distributions");

function perr(m) {
    console.log("Error: " + m);
}

var agent = require("./lib/agent");

var getOptions = function (doc) {
    "use strict";
    var o = $d(doc);
    var help = $o("-h", "--help", false, o);
    var useDistribution = o.distribution;
    var collect = o.collect;
    var lambda = parseFloat($o("-l", "--lambda", 1, o));
    var type = $o("-t", "--type", "fixed", o);
    var computeServiceTime = o["service-time"];
    if (computeServiceTime) {
        type = "servicetime";
    }
    var url = $o("-u", "--url", undefined, o);
    var get = $o("-e", "--get", false, o);
    var data = $o("-d", "--datafile", undefined, o);
    var tag = $o("-g", "--tag", undefined, o);
    var num = parseInt($o("-n", "--numreq", 10, o));

    return {
        help: help, useDistribution: useDistribution, computeServiceTime: computeServiceTime, collect: collect, lambda: lambda, type: type, url: url, data: data, tag: tag, num: num, get: get
    };
};

function measureRequest(opts, payload) {
    var startTime = process.hrtime();
    var type = opts.type;
    var tag = opts.tag;
    var lambda = opts.lambda;

    var promise = undefined;
    if (opts.get) {
        promise = agent.get(opts.url).end();
    } else {
        promise = agent.post(opts.url).send(payload).end();
    }
    return promise.then(function () {
        var responseTime = process.hrtime(startTime);
        var nano = responseTime[1];
        var secs = responseTime[0];
        responseTime = secs * 1000 + nano / 1000000;
        var success = true;
        return {
            type: type, tag: tag, lambda: lambda, responseTime: responseTime, success: success
        };
    })["catch"](function () {
        var success = false;
        var responseTime = 0;
        return {
            type: type, tag: tag, lambda: lambda, responseTime: responseTime, success: success
        };
    });
}

function processServiceTime(opts, payload) {
    var num = opts.num;

    return $b.mapSeries(_.range(0, num), function () {
        return measureRequest(opts, payload);
    });
}

function processDist(opts, payload, generator) {
    var num = opts.num;

    var times = _.map(_.range(0, num - 1), generator);
    debug("Numbers extracted from sampler: " + times);
    times = R.scan(R.add, 1, times);
    debug("Scheduled reqs at " + times);
    return $b.map(times, function (time) {
        return $b.delay(time * 1000).then(function () {
            return measureRequest(opts, payload);
        });
    });
}

function processExponential(opts, payload) {
    var samples = PD.rexp(opts.num, opts.lambda);
    var gen = function (i) {
        return samples[i];
    };
    return processDist(opts, payload, gen);
}

function processFixed(opts, payload) {
    var lambda = opts.lambda;

    return processDist(opts, payload, function () {
        return 1 / lambda;
    });
}

function processWorkload(opts, payload) {
    var type = opts.type;
    var computeServiceTime = opts.computeServiceTime;

    var dataPromise = {};
    if (!computeServiceTime) {
        if (type === "fixed") {
            dataPromise = processFixed(opts, payload);
        } else {
            if (type === "exponential") {
                dataPromise = processExponential(opts, payload);
            }
        }
    } else {
        dataPromise = processServiceTime(opts, payload);
    }
    return dataPromise;
}

var main = function () {
    $f.readLocal("docs/usage.md").then(function (it) {
        var opts = getOptions(it);
        debug(opts);
        var help = opts.help;
        var data = opts.data;
        var tag = opts.tag;

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
                    processWorkload(opts, payload).then(function (it) {
                        console.log(JSON.stringify(it, 0, 4));
                    });
                }
            });
        }
    });
};

main();
