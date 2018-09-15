# play-doh

Writing a DoH server to understand DNS over HTTPS better.

## To play with this

Start the server with `npm start`.

```shell
# GET
$ curl 'localhost:8212/dns-query?dns=AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB' -v -H "Accept: application/dns-message" -o - | hexdump

0000000 0000 8081 0100 0100 0000 0000 7703 7777
0000010 6507 6178 706d 656c 6303 6d6f 0000 0001
0000020 c001 000c 0001 0001 0700 009b 5d04 d8b8
0000030 0022
0000031

# POST
$ echo -n 'AAABAAABAAAAAAAAA3d3dwdleGFtcGxlA2NvbQAAAQAB' | base64 -d | curl -H 'Content-Type: application/dns-message' --data-binary @- localhost:8212/dns-query -o - | hexdump

0000000 0000 8081 0100 0100 0000 0000 7703 7777
0000010 6507 6178 706d 656c 6303 6d6f 0000 0001
0000020 c001 000c 0001 0001 0700 0065 5d04 d8b8
0000030 0022
0000031
```
