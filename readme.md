# camus-test
> A little utility for testing the CAMUS prototype

## Install

Install it with

```
npm install camus-test
```
## Usage

```
Usage:
    camus-test distribution [ -n N ] ( -u URL ) ( -d DATA ) ( -g TAG ) [ -e ] [ -l LAMBDA ] [ -t TYPE ]
    camus-test service-time [ -n N ] ( -u URL ) ( -d DATA ) ( -g TAG ) [ -e ]
    camus-test ( -h | --help )

Options:
    -h, --help              help for camus-test
    -n, --numreq            number of requests             [default: 10]
    -l, --lambda LAMBDA     arrival rate (Req/s)           [default: 1]
    -t, --type TYPE         arrival time distribution      [default: fixed]
    -u, --url URL           url endpoint
    -d, --datafile DATA     file with request payloads
    -g, --tag TAG           payload to use
    -e, --get               use HTTP get

Commands:
    service-time            measure service time (back-to-back requests)
    distribution            measure response time

Arguments:
    DATA                    file with the request payloads

Description:

    The following arrival rate distributions are available:

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



# Bug fixes

-     use correct scale factor for computing milliseconds -- [Jan 15th 16](../../commit/7527e75213e7b47b4f62eccd798095d602e920ed)
