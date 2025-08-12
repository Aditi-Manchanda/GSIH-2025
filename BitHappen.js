'use strict';

function bitmapExtraction(bmpBase64) {
    var buf = Buffer.from(bmpBase64, 'base64');
    var offset = buf.readUInt32LE(10);
    var pixelData = buf.slice(offset);
    var bits = [];
    for (var i = 0; i + 2 < pixelData.length; i += 3) {
        bits.push(pixelData[i] & 1);
    }
    var chars = [];
    for (var i = 0; i + 7 < bits.length; i += 8) {
        var byte = 0;
        for (var j = 0; j < 8; j++) {
            byte = (byte << 1) | bits[i + j];
        }
        chars.push(byte);
    }
    var hidden = String.fromCharCode.apply(null, chars);
    var m = /ABC\{(\d+)\}/.exec(hidden);
    return m ? parseInt(m[1], 10) : 0;
}

function simulateMyst(program, memAddr) {
    var mem = new Uint8Array(256);
    var regs = new Uint8Array(16);
    var Z = false;
    var IP = 0;
    while (IP < program.length) {
        var op = program[IP];
        if (op === 0xFF) break;
        if (op === 0x01) {
            var imm = program[IP+1];
            var r = program[IP+2] & 0x0F;
            regs[r] = imm;
            IP += 3;
        } else if (op === 0x02) {
            var x = program[IP+1] & 0x0F;
            var y = program[IP+2] & 0x0F;
            regs[y] = (regs[y] + regs[x]) & 0xFF;
            IP += 3;
        } else if (op === 0x03) {
            var x = program[IP+1] & 0x0F;
            var y = program[IP+2] & 0x0F;
            regs[y] = (regs[y] - regs[x] + 256) & 0xFF;
            Z = regs[y] === 0;
            IP += 3;
        } else if (op === 0x04) {
            IP = program[IP+1];
        } else if (op === 0x05) {
            IP = Z ? program[IP+1] : IP + 2;
        } else if (op === 0x06) {
            var addr = program[IP+1];
            var r2 = program[IP+2] & 0x0F;
            regs[r2] = mem[addr];
            IP += 3;
        } else if (op === 0x07) {
            var r3 = program[IP+1] & 0x0F;
            var addr2 = program[IP+2];
            mem[addr2] = regs[r3];
            IP += 3;
        } else if (op === 0x08) {
            var tgt = program[IP+1];
            regs[15] = (regs[15] - 1 + 256) & 0xFF;
            mem[regs[15]] = (IP + 2) & 0xFF;
            IP = tgt;
        } else if (op === 0x09) {
            var ret = mem[regs[15]];
            regs[15] = (regs[15] + 1) & 0xFF;
            IP = ret;
        } else {
            break;
        }
    }
    return mem[memAddr];
}

function processData(input) {
    input = input.trim();
    var obj;
    try {
        var jsonText = Buffer.from(input, 'base64').toString('utf8');
        obj = JSON.parse(jsonText);
    } catch (e) {
        console.log('0 0 0');
        return;
    }
    var commonBmpB64 =
        'Qk02AwAAAAAAADYAAAAoAAAAEAAAABAAAAABABgAAAAAAAADAAATCwAAEwsAAAAAAAAAAAAAzOvv+fL9+Mz02vLa1s/Z2OH8ysz109Hw8u/R1+nS+uva8Obhzufd2tzW09DT5PPiyObN+fzK9Oj14tbpztvJ7OP/9+DZ8dHM7trn+dPx29zU49fY2fnOztT02ejx2/ji2ur1/tDoy8jz3/bS6PzQ+OzSyuHY//Xr/sr30NLf/erM49re+NTv8PHs0u/k6dDy4Nfb2tXL4+XZ49PN4tjh3/br4uHQ6ujn1tzp/vHu//Tt+cjz9eXL0O3X/PDS8Pn2/PDZ6uHr4+vl9/3Vyu3l6/bS+eTly93o6u3W3tjJ68j1/97m3fr9+vPIzNzk08rq/Org+/fw1+T0+d/z1e/e39fV+u/K1+jbzPzlzM7w6tz38NPiyPf2+vn90Nbx3OPn2NLN8OTi9PHl2ubL6P/51tDk9tDz3O/n79D0///W88741fji1/jR7+3t1dnuyNPr7OHj7M3x0+ro4P3w5eL45+vu5d/s9OHW0dPU0N3e4ufQ3uTR7tvk5s3h//D3z/fO+uPd7vbl/v3m7eHj0uT34OnY+Nbs9eH609XX79bLyunNy8zM0N3qy83O5PrS5Pjl4vvS39v//ePM6vTv6e7Jy8/u5cnW9/Dt/8jj4PDj9/Dt0uj52ebR8P/9z8nc/fLb5f/h2OLI6+br6t3U8O3T9srU1Pf07dbS1Of30/7i2Nz93uvY1fLs6Ov03c3f0OLM7ePQ2eDd/Pz55uDK+8nczt3l2/Xj/8nl88rxytT/zfjN09bK0N3P0svt7PDo2fXv3tf04+ba4uzjz93Q39/268vO1NTV+Ov24OjQ+Prv+N3P0eHl3O35z97Z0ePk687i6ebl0dvm2vrs0NHs9+DI6M/079zW7O3Y4f789ezV4ej77fPi5/XU5sjk2d7k2ena8sjl5Oj599zv3ufZ5tblytTY0d/b5+vd583zztLr3vfr+u/j2PrZ0vf3yOTy4NLx8ej/69zS5N7w8srV9//k6Or54NLs++ff38/R383i79Dn+OTy2ubS0e7S39n159Xs';
    var sub1 = bitmapExtraction(commonBmpB64);
    var n = obj.n >>> 0;
    for (var i = 0; i < n; i++) {
        var tc = obj.data[i];
        var sub2 = 0;
        try {
            var pcapBuf = Buffer.from(tc.pcap, 'base64');
            var pcapStr = pcapBuf.toString('latin1');
            var m = /ABC\{(\d+)\}/.exec(pcapStr);
            if (m) {
                var big = BigInt(m[1]);
                sub2 = Number((big % 10007n) + 3n);
            }
        } catch (e) {
            sub2 = 0;
        }
        var sub3 = 0;
        try {
            var mystText = Buffer.from(tc.myst, 'base64').toString('utf8');
            var hexPairs = mystText.match(/[A-Fa-f0-9]{2}/g) || [];
            var program = hexPairs.map(function(h){ return parseInt(h, 16); });
            sub3 = simulateMyst(program, tc.memory_address >>> 0);
        } catch (e) {
            sub3 = 0;
        }
        console.log(sub1 + ' ' + sub2 + ' ' + sub3);
    }
}

process.stdin.resume();
process.stdin.setEncoding('ascii');
var _input = '';
process.stdin.on('data', function(chunk){ _input += chunk; });
process.stdin.on('end', function(){ processData(_input); });
