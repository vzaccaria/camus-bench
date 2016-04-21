/* eslint quotes: [0], strict: [0] */
let {
    $d, $o, $f, _, $fs
    // $r.stdin() -> Promise  ;; to read from stdin
} = require('zaccaria-cli')

let $b = require('bluebird')
let R = require('ramda')
let debug = require('debug')('camus-bench')
let PD = require('probability-distributions')

function perr(m) {
    console.log(`Error: ${m}`);
}

let agent = require('./lib/agent')

let getOptions = doc => {
    "use strict"
    let o = $d(doc)
    let help = $o('-h', '--help', false, o)
    let useDistribution = o.distribution
    let collect = o.collect
    let lambda = parseFloat($o('-l', '--lambda', 1.0, o))
    let type = $o('-t', '--type', 'fixed', o)
    let computeServiceTime = o["service-time"]
    if(computeServiceTime) {
        type = 'servicetime'
    }
    let url = $o('-u', '--url', undefined, o)
    let get = $o('-e', '--get', false, o)
    let data = $o('-d', '--datafile', undefined, o)
    let tag = $o('-g', '--tag', undefined, o)
    let num = parseInt($o('-n', '--numreq', 10, o))

    return {
        help, useDistribution, computeServiceTime, collect, lambda, type, url, data, tag, num, get
    }
} 

function measureRequest(opts, payload) {
    let startTime = process.hrtime();
    let {
        type, tag, lambda
    } = opts
    let promise
    if (opts.get) {
        promise = agent.get(opts.url).end()
    } else {
        promise = agent.post(opts.url).send(payload).end();
    }
    return promise.then(() => {
        let responseTime = process.hrtime(startTime);
        let nano = responseTime[1];
        let secs = responseTime[0];
        responseTime = secs * 1000 + nano / 1000000
        let success = true
        return {
            type, tag, lambda, responseTime, success
        }
    }).catch(() => {
        let success = false
        let responseTime = 0
        return {
            type, tag, lambda, responseTime, success
        }
    })
}

function processServiceTime(opts, payload) {
    let {
        num
    } = opts;
    return $b.mapSeries(_.range(0, num), () => {
        return measureRequest(opts, payload)
    })

}

function processDist(opts, payload, generator) {
    let {
        num
    } = opts;
    let times = _.map(_.range(0, num - 1), generator)
    debug(`Numbers extracted from sampler: ${times}`)
    times = R.scan(R.add, 1, times)
    debug(`Scheduled reqs at ${times}`)
    return $b.map(times, (time) => {
        return $b.delay(time * 1000).then(() => {
            return measureRequest(opts, payload)
        })
    })

}

function processExponential(opts, payload) {
    let samples = PD.rexp(opts.num, opts.lambda)
    let gen = (i) => {
        return samples[i]
    }
    return processDist(opts, payload, gen)
}

function processFixed(opts, payload) {
    let {
        lambda
    } = opts;
    return processDist(opts, payload, () => 1 / lambda)
}

function processWorkload(opts, payload) {
    let {
        type, computeServiceTime
    } = opts
    let dataPromise = {}
    if (!computeServiceTime) {
        if (type === 'fixed') {
            dataPromise = processFixed(opts, payload)
        } else {
            if (type === 'exponential') {
                dataPromise = processExponential(opts, payload)
            }
        }

    } else {
        dataPromise = processServiceTime(opts, payload)
    }
    return dataPromise
}

let main = () => {
    $f.readLocal('docs/usage.md').then(it => {
        let opts = getOptions(it)
        debug(opts);
        let {
            help, data, tag
        } = opts;
        if (help) {
            console.log(it)
        } else {
            $fs.readFileAsync(data, 'utf8').then((dta) => {
                dta = JSON.parse(dta)
                let res = _.find(dta, (e) => {
                    return e.tag === tag
                })
                if (_.isUndefined(res)) {
                    perr(`cant find object key ${tag} in ${data}`);
                    process.exit(0);
                } else {
                    let payload = res.payload;
                    processWorkload(opts, payload).then((it) => {
                        console.log(JSON.stringify(it, 0, 4));
                    })
                }
            })
        }
    })
}

main()
