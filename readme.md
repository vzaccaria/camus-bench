# camus-test
> No name given yet

## Install

Install it with

```
npm install camus-test
```
## Usage

```
Usage:
    camus-test distribution [ -n N ] [ -l LAMBDA ] [ -t TYPE ] ( -e URL ) ( -d DATA ) ( -g TAG )
    camus-test service-time [ -n N ] [ -e URL ]
    camus-test collect FILES...
    camus-test ( -h | --help )

Options:
    -h, --help              help for camus-test
    -n, --numreq            number of requests             [default: 10]
    -l, --lambda LAMBDA     arrival rate                   [default: 1 (Req/s)]
    -t, --type TYPE         arrival time distribution      [default: fixed]
    -e, --endpoint URL      url endpoint
    -d, --datafile DATA     file with request payloads
    -g, --tag TAG           payload to use

Commands:
    service-time            measure service time (back-to-back requests)
    distribution            measure response time
    collect                 collect several json measurements into a single one

Arguments:
    FILES                   files to be collected
    DATA                    files with request payload

Description:
    The following are the arrival rate distributions available:

    - 'fixed': arrivals occur at fixed regular intervals (uses the parameter LAMBDA to specify the rate).

    - 'exponential': uses parameter LAMBDA which is interpreted as the average number of
    requests per second. The exponential distribution occurs when describing the
    lengths of the inter-arrival times in a homogeneous poisson process
    (arrivals are independent).

    DATA should be of the type [ { "tag": STRING, "payload": { REQUEST } ].

```

## Author

* Vittorio Zaccaria

## License
Released under the BSD License.

***


