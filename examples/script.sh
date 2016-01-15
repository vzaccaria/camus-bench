DEBUG=* ../index.js service-time -u "http://www.google.com" -d ./payload.json -g 100 --get -n 3
DEBUG=* ../index.js distribution -t exponential -u "http://www.google.com" -d ./payload.json -g 100 --get -n 3
DEBUG=* ../index.js distribution -t fixed -u "http://www.google.com" -d ./payload.json -g 100 --get -n 3
