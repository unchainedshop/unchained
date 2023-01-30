import { hashPassword } from "./hashPassword.js";

it('Should hash plain string sha256 and return a hex ', async () => {      
    expect(hashPassword('hello_world')).toEqual('35072c1ae546350e0bfa7ab11d49dc6f129e72ccd57ec7eb671225bbd197c8f1')
  });