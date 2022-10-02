/* eslint-disable prefer-const */
import md5 from 'blueimp-md5'
import bigInt from 'big-integer'

class MyRsa {
  constructor () {
    this.n = bigInt('8686980c0f5a24c4b9d43020cd2c22703ff3f450756529058b1cf88f09b8602136477198a6e2683149659bd122c33592fdb5ad47944ad1ea4d36c6b172aad6338c3bb6ac6227502d010993ac967d1aef00f0c8e038de2e4d3bc2ec368af2e9f10a6f1eda4f7262f136420c07c331b871bf139f74f3010e3c4fe57df3afb71683', 16)
    this.e = bigInt('10001', 16)
  };

  a2hex (byteArray) {
    let hexString = ''
    let nextHexByte
    for (let i = 0; i < byteArray.length; i++) {
      nextHexByte = byteArray[i].toString(16)
      if (nextHexByte.length < 2) {
        nextHexByte = '0' + nextHexByte
      }
      hexString += nextHexByte
    }
    return hexString
  }

  hex2a (hex) {
    let str = ''
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    }
    return str
  }

  pkcs1pad2 (s, n) {
    if (n < s.length + 11) {
      return null
    }
    let ba = []
    let i = s.length - 1
    while (i >= 0 && n > 0) {
      ba[--n] = s.charCodeAt(i--)
    }
    ba[--n] = 0
    while (n > 2) { // random non-zero pad
      ba[--n] = 0xff
    }
    ba[--n] = 2
    ba[--n] = 0
    let c = this.a2hex(ba)
    return bigInt(c, 16)
  }

  pkcs1unpad2 (a) {
    let b = a.toString(16)
    if (b.length % 2 !== 0) {
      b = '0' + b
    }
    let c = this.hex2a(b)
    let i = 1
    while (c.charCodeAt(i) !== 0) {
      i++
    }
    return c.slice(i + 1)
  }

  encrypt (text) {
    let m = this.pkcs1pad2(text, 0x80)
    let c = m.modPow(this.e, this.n)
    let h = c.toString(16)
    while (h.length < 0x80 * 2) {
      h = '0' + h
    }
    return h
  };

  decrypt (text) {
    let ba = []
    let i = 0
    while (i < text.length) {
      ba[i] = text.charCodeAt(i)
      i += 1
    }
    let a = bigInt(this.a2hex(ba), 16)
    let c = a.modPow(this.e, this.n)
    let d = this.pkcs1unpad2(c)
    return d
  };
}

class Secret {
  constructor () {
    this.rsa = new MyRsa()

    this.kts = [240, 229, 105, 174, 191, 220, 191, 138, 26, 69, 232, 190, 125, 166, 115, 184, 222, 143, 231, 196, 69, 218, 134, 196, 155, 100, 139, 20, 106, 180, 241, 170, 56, 1, 53, 158, 38, 105, 44, 134, 0, 107, 79, 165, 54, 52, 98, 166, 42, 150, 104, 24, 242, 74, 253, 189, 107, 151, 143, 77, 143, 137, 19, 183, 108, 142, 147, 237, 14, 13, 72, 62, 215, 47, 136, 216, 254, 254, 126, 134, 80, 149, 79, 209, 235, 131, 38, 52, 219, 102, 123, 156, 126, 157, 122, 129, 50, 234, 182, 51, 222, 58, 169, 89, 52, 102, 59, 170, 186, 129, 96, 72, 185, 213, 129, 156, 248, 108, 132, 119, 255, 84, 120, 38, 95, 190, 232, 30, 54, 159, 52, 128, 92, 69, 44, 155, 118, 213, 27, 143, 204, 195, 184, 245]

    this.keyS = [0x29, 0x23, 0x21, 0x5E]

    this.keyL = [120, 6, 173, 76, 51, 134, 93, 24, 76, 1, 63, 70]
  }

  xor115Enc (src, srclen, key, keylen) {
    let i, j, k, mod4, ref, ref1, ref2, ret
    mod4 = srclen % 4
    ret = []
    if (mod4 !== 0) {
      for (i = j = 0, ref = mod4; (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
        ret.push(src[i] ^ key[i % keylen])
      }
    }
    for (i = k = ref1 = mod4, ref2 = srclen; (ref1 <= ref2 ? k < ref2 : k > ref2); i = ref1 <= ref2 ? ++k : --k) {
      ret.push(src[i] ^ key[(i - mod4) % keylen])
    }
    return ret
  };

  getkey (length, key) {
    let i
    if (key != null) {
      return (() => {
        let j, ref, results
        results = []
        for (i = j = 0, ref = length; (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
          results.push(((key[i] + this.kts[length * i]) & 0xff) ^ this.kts[length * (length - 1 - i)])
        }
        return results
      })()
    }
    if (length === 12) {
      return this.keyL.slice(0)
    }
    return this.keyS.slice(0)
  }

  asymEncode (src, srclen) {
    let i, j, m, ref, ret
    m = 128 - 11
    ret = ''
    for (i = j = 0, ref = Math.floor((srclen + m - 1) / m); (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
      ret += this.rsa.encrypt(this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen))))
    }
    return window.btoa(this.rsa.hex2a(ret))
  }

  asymDecode (src, srclen) {
    let i, j, m, ref, ret
    m = 128
    ret = ''
    for (i = j = 0, ref = Math.floor((srclen + m - 1) / m); (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
      ret += this.rsa.decrypt(this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen))))
    }
    return this.stringToBytes(ret)
  };

  symEncode (src, srclen, key1, key2) {
    let k1, k2, ret
    k1 = this.getkey(4, key1)
    k2 = this.getkey(12, key2)
    ret = this.xor115Enc(src, srclen, k1, 4)
    ret.reverse()
    ret = this.xor115Enc(ret, srclen, k2, 12)
    return ret
  };

  symDecode (src, srclen, key1, key2) {
    let k1, k2, ret
    k1 = this.getkey(4, key1)
    k2 = this.getkey(12, key2)
    ret = this.xor115Enc(src, srclen, k2, 12)
    ret.reverse()
    ret = this.xor115Enc(ret, srclen, k1, 4)
    return ret
  };

  bytesToString (buf) {
    let i, j, len, ret
    ret = ''
    for (j = 0, len = buf.length; j < len; j++) {
      i = buf[j]
      ret += String.fromCharCode(i)
    }
    return ret
  }

  stringToBytes (str) {
    let i, j, ref, ret
    ret = []
    for (i = j = 0, ref = str.length; (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
      ret.push(str.charCodeAt(i))
    }
    return ret
  }

  encode (str, timestamp) {
    const key = this.stringToBytes(md5(`!@###@#${timestamp}DFDR@#@#`))
    let temp = this.stringToBytes(str)
    temp = this.symEncode(temp, temp.length, key, null)
    temp = key.slice(0, 16).concat(temp)
    return {
      data: this.asymEncode(temp, temp.length),
      key
    }
  }

  decode (str, key) {
    let temp = this.stringToBytes(window.atob(str))
    temp = this.asymDecode(temp, temp.length)
    return this.bytesToString(this.symDecode(temp.slice(16), temp.length - 16, key, temp.slice(0, 16)))
  }
}

export default new Secret()
