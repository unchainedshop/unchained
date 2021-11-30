
PaymentCredentials.helpers({
  async user() {
    return Users.findOne({
      _id: this.userId,
    });
  },
  async paymentProvider() {
    return PaymentProviders.findOne({
      _id: this.paymentProviderId,
    });
  },
  async isValid() {
    const provider = await this.paymentProvider();
    return provider.validate(this);
  },
});

PaymentProviders.helpers({
  defaultContext(context) {
    return context || emptyContext;
  },
  interface() {
    return new PaymentDirector(this).interfaceClass();
  },
  configurationError() {
    return new PaymentDirector(this).configurationError();
  },
  isActive(context) {
    return new PaymentDirector(this).isActive(this.defaultContext(context));
  },
  isPayLaterAllowed(context) {
    return new PaymentDirector(this).isPayLaterAllowed(
      this.defaultContext(context)
    );
  },
  register(context) {
    return Promise.await(
      new PaymentDirector(this).register(this.defaultContext(context))
    );
  },
  validate(credentials) {
    return Promise.await(new PaymentDirector(this).validate(credentials));
  },
  sign(context) {
    return Promise.await(
      new PaymentDirector(this).sign(this.defaultContext(context))
    );
  },
  charge(context, userId) {
    const director = new PaymentDirector(this);
    const normalizedContext = this.defaultContext({
      ...context,
      transactionContext: {
        ...context.transactionContext,
        paymentCredentials:
          context.transactionContext?.paymentCredentials ??
          PaymentCredentials.findOne({
            userId,
            paymentProviderId: this._id,
            isPreferred: true,
          }),
      },
    });
    const result = Promise.await(director.charge(normalizedContext, userId));
    if (!result) return false;
    const { credentials, ...strippedResult } = result;
    if (credentials) {
      PaymentCredentials.upsertCredentials({
        userId,
        paymentProviderId: this._id,
        ...credentials,
      });
    }
    return strippedResult;
  },
});
