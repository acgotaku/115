/* eslint-disable prefer-const */
import md5 from 'blueimp-md5'

class Secret {
  constructor () {
    this.publicKey = new window.JSEncrypt()
    this.publicKey.setPublicKey(`-----BEGIN RSA PUBLIC KEY-----
    MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDR3rWmeYnRClwLBB0Rq0dlm8Mr
    PmWpL5I23SzCFAoNpJX6Dn74dfb6y02YH15eO6XmeBHdc7ekEFJUIi+swganTokR
    IVRRr/z16/3oh7ya22dcAqg191y+d6YDr4IGg/Q5587UKJMj35yQVXaeFXmLlFPo
    kFiz4uPxhrB7BGqZbQIDAQAB
    -----END RSA PUBLIC KEY-----`)
    this.privateKey = new window.JSEncrypt()
    this.privateKey.setPrivateKey(`-----BEGIN RSA PRIVATE KEY-----
    MIICXAIBAAKBgQCMgUJLwWb0kYdW6feyLvqgNHmwgeYYlocst8UckQ1+waTOKHFC
    TVyRSb1eCKJZWaGa08mB5lEu/asruNo/HjFcKUvRF6n7nYzo5jO0li4IfGKdxso6
    FJIUtAke8rA2PLOubH7nAjd/BV7TzZP2w0IlanZVS76n8gNDe75l8tonQQIDAQAB
    AoGANwTasA2Awl5GT/t4WhbZX2iNClgjgRdYwWMI1aHbVfqADZZ6m0rt55qng63/
    3NsjVByAuNQ2kB8XKxzMoZCyJNvnd78YuW3Zowqs6HgDUHk6T5CmRad0fvaVYi6t
    viOkxtiPIuh4QrQ7NUhsLRtbH6d9s1KLCRDKhO23pGr9vtECQQDpjKYssF+kq9iy
    A9WvXRjbY9+ca27YfarD9WVzWS2rFg8MsCbvCo9ebXcmju44QhCghQFIVXuebQ7Q
    pydvqF0lAkEAmgLnib1XonYOxjVJM2jqy5zEGe6vzg8aSwKCYec14iiJKmEYcP4z
    DSRms43hnQsp8M2ynjnsYCjyiegg+AZ87QJANuwwmAnSNDOFfjeQpPDLy6wtBeft
    5VOIORUYiovKRZWmbGFwhn6BQL+VaafrNaezqUweBRi1PYiAF2l3yLZbUQJAf/nN
    4Hz/pzYmzLlWnGugP5WCtnHKkJWoKZBqO2RfOBCq+hY4sxvn3BHVbXqGcXLnZPvo
    YuaK7tTXxZSoYLEzeQJBAL8Mt3AkF1Gci5HOug6jT4s4Z+qDDrUXo9BlTwSWP90v
    wlHF+mkTJpKd5Wacef0vV+xumqNorvLpIXWKwxNaoHM=
    -----END RSA PRIVATE KEY-----`)

    this.kts = [0xF0, 0xE5, 0x69, 0xAE, 0xBF, 0xDC, 0xBF, 0x5A, 0x1A, 0x45, 0xE8, 0xBE, 0x7D, 0xA6, 0x73, 0x88, 0xDE, 0x8F, 0xE7, 0xC4, 0x45, 0xDA, 0x86, 0x94, 0x9B, 0x69, 0x92, 0x0B, 0x6A, 0xB8, 0xF1, 0x7A, 0x38, 0x06, 0x3C, 0x95, 0x26, 0x6D, 0x2C, 0x56, 0x00, 0x70, 0x56, 0x9C, 0x36, 0x38, 0x62, 0x76, 0x2F, 0x9B, 0x5F, 0x0F, 0xF2, 0xFE, 0xFD, 0x2D, 0x70, 0x9C, 0x86, 0x44, 0x8F, 0x3D, 0x14, 0x27, 0x71, 0x93, 0x8A, 0xE4, 0x0E, 0xC1, 0x48, 0xAE, 0xDC, 0x34, 0x7F, 0xCF, 0xFE, 0xB2, 0x7F, 0xF6, 0x55, 0x9A, 0x46, 0xC8, 0xEB, 0x37, 0x77, 0xA4, 0xE0, 0x6B, 0x72, 0x93, 0x7E, 0x51, 0xCB, 0xF1, 0x37, 0xEF, 0xAD, 0x2A, 0xDE, 0xEE, 0xF9, 0xC9, 0x39, 0x6B, 0x32, 0xA1, 0xBA, 0x35, 0xB1, 0xB8, 0xBE, 0xDA, 0x78, 0x73, 0xF8, 0x20, 0xD5, 0x27, 0x04, 0x5A, 0x6F, 0xFD, 0x5E, 0x72, 0x39, 0xCF, 0x3B, 0x9C, 0x2B, 0x57, 0x5C, 0xF9, 0x7C, 0x4B, 0x7B, 0xD2, 0x12, 0x66, 0xCC, 0x77, 0x09, 0xA6]

    this.keyS = [0x29, 0x23, 0x21, 0x5E]

    this.keyL = [0x42, 0xDA, 0x13, 0xBA, 0x78, 0x76, 0x8D, 0x37, 0xE8, 0xEE, 0x04, 0x91]
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
      ret += window.atob(this.publicKey.encrypt(this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen)))))
    }
    return window.btoa(ret)
  }

  asymDecode (src, srclen) {
    let i, j, m, ref, ret
    m = 128
    ret = ''
    for (i = j = 0, ref = Math.floor((srclen + m - 1) / m); (ref >= 0 ? j < ref : j > ref); i = ref >= 0 ? ++j : --j) {
      ret += this.privateKey.decrypt(window.btoa(this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen)))))
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
