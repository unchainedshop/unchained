import Strategy from 'passport-strategy';

export default class AccessTokenStrategy extends Strategy {
  name: string;

  pass: any;

  _verify: any;

  success: any;

  constructor(verify) {
    super();

    if (!verify) {
      throw new TypeError('AccessTokenStrategy requires a verify callback');
    }
    // eslint-disable-next-line
    this._verify = verify;

    // Set the default name of our strategy
    this.name = 'access-token';
  }

  authenticate(req) {
    if (req.headers.authorization) {
      const [type, token] = req.headers.authorization.split(' ');
      if (type === 'Bearer') {
        // eslint-disable-next-line
        this._verify(token, (err, user) => {
          if (!user || err) return this.pass();
          this.success(user);
        });
        return;
      }
    }
    this.pass();
  }
}
