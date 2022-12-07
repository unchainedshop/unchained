
import {hashPassword} from '../src/module/utils/hashPassword'
import {buf2hex, toArrayBuffer } from '../src/module/configureAccountsWebAuthnModule'

describe('Accounts', () => {
    it('Should hash plain string sha256 and return a hex ', async () => {      
      expect(hashPassword('hello_world')).toEqual('35072c1ae546350e0bfa7ab11d49dc6f129e72ccd57ec7eb671225bbd197c8f1')
    });

    it('buf2hex should convert buffer to HEX', () => {
      expect(buf2hex(Buffer.from("hello"))).toEqual('68656c6c6f')
    })
    it('toArrayBuffer should return ArrayBuffer', () => {
      console.log(toArrayBuffer(Buffer.from("hello")))
      expect(toArrayBuffer(Buffer.from("hello"))).toBeInstanceOf(ArrayBuffer)
    })
});
