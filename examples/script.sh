#DEBUG=* ../index.js distribution -t exponential -u "http://www.google.com" -d ./payload.json -g 100 --lambda 1.0 --get
../index.js service-time -u "http://www.google.com" -d ./payload.json -g 100 --get -n 1
