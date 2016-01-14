/* eslint quotes: [0], strict: [0] */
let {
    $d, $o, $f, _, $fs, $b
    // $r.stdin() -> Promise  ;; to read from stdin
} = require('zaccaria-cli')

let R = require('ramda')
let debug = require('debug')('camus-bench')

function perr(m) {
    console.log(`Error: ${m}`);
}

let agent = require('./lib/agent')

let getOptions = doc => {
    "use strict"
    let o = $d(doc)
    let help = $o('-h', '--help', false, o)
    let useDistribution = o.distribution
    let computeServiceTime = o["service-time"]
    let collect = o.collect
    let lambda = parseFloat($o('-l', '--lambda', 1.0, o))
    let type = $o('-t', '--type', 'fixed', o)
    let url = $o('-e', '--endpoint', undefined, o)
    let data = $o('-d', '--datafile', undefined, o)
    let tag = $o('-g', '--tag', undefined, o)
    let num = $o('-n', '--num', 10, o)

    return {
        help, useDistribution, computeServiceTime, collect, lambda, type, url, data, tag, num
    }
}

function measureRequest(opts, payload) {
    let startTime = process.hrtime();
    let { type, tag, lambda } = opts
    return agent.get(opts.url).end().then( () => {
        let responseTime = process.hrtime(startTime);
        let success = true
        return { type, tag, lambda, responseTime, success }
    }).catch( () => {
        let success = false
        let responseTime = 0
        return { type, tag, lambda, responseTime, success }
    })
}

function processFixed(opts, payload) {
    let { lambda, num } = opts;
    let times = _.map(_.range(0, num), () => 1/lambda)
    debug(times)
    times = R.scan(R.add, 1, times)
    debug(times)
    return $b.map(times, (time) => {
        return $b.delay(time*1000).then( () => {
            return measureRequest(opts, payload)
        })
    })
}

let main = () => {
    $f.readLocal('docs/usage.md').then(it => {
        let opts = getOptions(it)
        debug(opts);
        let {
            help, data, tag, type
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
                    if(type === 'fixed') {
                        processFixed(opts, payload).then( (it) => {
                            console.log(JSON.stringify(it, 0, 4));
                        })
                    }
                }
            })
        }
    })
}

main()
