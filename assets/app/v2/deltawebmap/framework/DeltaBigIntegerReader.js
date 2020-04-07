"use strict";
class DeltaBigIntegerReader {
    constructor() {

    }

    static _copyA(a) {
        var ret = new Uint8Array(a.length);
        for (var i = 0; i < a.length; i++) {
            ret[i] = a[i];
        }
        return ret;
    }

    static _isZero(a) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== 0)
                return false;
        }
        return true;
    }

    static _clampA(a) {
        var alen = a.length;
        var i = 0;
        while (a[alen - 1] === 0) alen--;
        var ret = new Uint8Array(alen);
        for (var i = 0; i < alen; i++) {
            ret[i] = a[i];
        }
        return ret;
    }

    static _divRem(a, d) {
        var divrem = function (u, m, v, q, B) {
            var k = 0,
                t;
            for (var j = m - 1; j >= 0; j--) {
                k = (k * 256);
                k += u[j];
                if (k >= v) {
                    t = Math.floor(k / v);
                    k -= t * v;
                } else {
                    t = 0;
                }
                q[j] = t;
            }
            return k;
        };
        var Q = new Uint8Array(a.length);
        var R = divrem(a, a.length, d, Q, 8);
        Q = DeltaBigIntegerReader._clampA(Q);
        return [Q, R];
    }

    static _base256ToBase10(a) {
        var s = "";
        var t = DeltaBigIntegerReader._copyA(a);
        var qr = [];
        var i = a.length;
        while (!DeltaBigIntegerReader._isZero(t)) {
            qr = DeltaBigIntegerReader._divRem(t, 10);
            s = s + qr[1].toString(10);
            t = qr[0];
        }
        return s.split("").reverse().join("");
    }

    static ConvertBytesToString(a) {
        return DeltaBigIntegerReader._base256ToBase10(a);
    }

    static ConvertArrayBufferToString(buf, offset, len) {
        var t = new Uint8Array(len);
        for (var i = 0; i < len; i += 1) {
            t[i] = buf.getUint8(offset + i);
        }
        return DeltaBigIntegerReader.ConvertBytesToString(t);
    }
}