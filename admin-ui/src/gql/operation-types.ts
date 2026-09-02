/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
import type * as Types from './schema-types';

export type IMd5MetaDataFragment = {
  legalHeader: string | null;
  description: string | null;
  authenticatorVersion: number | null;
  protocolFamily: string | null;
  schema: number | null;
  authenticationAlgorithms: Array<string> | null;
  publicKeyAlgAndEncodings: Array<string> | null;
  attestationTypes: Array<string> | null;
  keyProtection: Array<string> | null;
  upv: Array<unknown> | null;
  tcDisplay: Array<unknown> | null;
  icon: string | null;
  authenticatorGetInfo: unknown;
};

export type IMd5MetaDataFragmentVariables = Exact<{ [key: string]: never }>;

export type IUserFragment = {
  _id: string;
  allowedActions: Array<Types.IRoleAction>;
  username: string | null;
  isGuest: boolean;
  isInitialPassword: boolean;
  name: string;
  roles: Array<string> | null;
  tags: Array<unknown> | null;
  deleted: unknown;
  lastBillingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    addressLine: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    countryCode: string | null;
    regionCode: string | null;
    city: string | null;
  } | null;
  lastContact: { emailAddress: string | null; telNumber: string | null } | null;
  lastLogin: {
    countryCode: string | null;
    locale: unknown;
    remoteAddress: string | null;
    remotePort: number | null;
    timestamp: unknown;
    userAgent: string | null;
  } | null;
  avatar: {
    _id: string;
    name: string;
    size: number;
    type: string;
    url: string | null;
  } | null;
  paymentCredentials: Array<{
    _id: string;
    isValid: boolean;
    isPreferred: boolean;
    paymentProvider: {
      _id: string;
      type: Types.IPaymentProviderType | null;
      interface: {
        _id: string;
        label: string | null;
        version: string | null;
      } | null;
    };
  }>;
  emails: Array<{ verified: boolean; address: string }> | null;
  web3Addresses: Array<{
    address: string;
    nonce: string | null;
    verified: boolean;
  }>;
  webAuthnCredentials: Array<{
    _id: string;
    created: unknown;
    aaguid: string;
    counter: number;
    mdsMetadata: {
      legalHeader: string | null;
      description: string | null;
      authenticatorVersion: number | null;
      protocolFamily: string | null;
      schema: number | null;
      authenticationAlgorithms: Array<string> | null;
      publicKeyAlgAndEncodings: Array<string> | null;
      attestationTypes: Array<string> | null;
      keyProtection: Array<string> | null;
      upv: Array<unknown> | null;
      tcDisplay: Array<unknown> | null;
      icon: string | null;
      authenticatorGetInfo: unknown;
    } | null;
  }>;
  profile: {
    displayName: string | null;
    phoneMobile: string | null;
    gender: string | null;
    birthday: unknown;
    address: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
  } | null;
  primaryEmail: { verified: boolean; address: string } | null;
  cart: { _id: string; items: Array<{ _id: string }> | null } | null;
  orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
};

export type IUserFragmentVariables = Exact<{ [key: string]: never }>;

export type ILogoutMutationVariables = Exact<{ [key: string]: never }>;

export type ILogoutMutation = { logout: { success: boolean | null } | null };

export type IAddEmailMutationVariables = Exact<{
  email: string;
  userId?: string | number | null | undefined;
}>;

export type IAddEmailMutation = {
  addEmail: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IAddWeb3AddressMutationVariables = Exact<{
  address: string;
}>;

export type IAddWeb3AddressMutation = {
  addWeb3Address: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IAddWebAuthnCredentialsMutationVariables = Exact<{
  credentials: unknown;
}>;

export type IAddWebAuthnCredentialsMutation = {
  addWebAuthnCredentials: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IBulkUpdateUserTagsMutationVariables = Exact<{
  userIds: Array<string | number>;
  add?: Array<unknown> | null | undefined;
  remove?: Array<unknown> | null | undefined;
}>;

export type IBulkUpdateUserTagsMutation = {
  bulkUpdateUserTags: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkRemoveUsersMutationVariables = Exact<{
  userIds: Array<string | number>;
}>;

export type IBulkRemoveUsersMutation = {
  bulkRemoveUsers: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkSetUserRolesMutationVariables = Exact<{
  userIds: Array<string | number>;
  roles: Array<string>;
}>;

export type IBulkSetUserRolesMutation = {
  bulkSetUserRoles: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IChangePasswordMutationVariables = Exact<{
  oldPassword: string;
  newPassword: string;
}>;

export type IChangePasswordMutation = {
  changePassword: { success: boolean | null } | null;
};

export type ICreateUserMutationVariables = Exact<{
  username?: string | null | undefined;
  email?: string | null | undefined;
  plainPassword?: string | null | undefined;
  profile?: Types.IUserProfileInput | null | undefined;
  webAuthnPublicKeyCredentials?: unknown;
}>;

export type ICreateUserMutation = {
  createUser: { _id: string; tokenExpires: unknown } | null;
};

export type ICreateWebAuthnCredentialCreationOptionsMutationVariables = Exact<{
  username: string;
}>;

export type ICreateWebAuthnCredentialCreationOptionsMutation = {
  createWebAuthnCredentialCreationOptions: unknown;
};

export type ICreateWebAuthnCredentialRequestOptionsMutationVariables = Exact<{
  username?: string | null | undefined;
}>;

export type ICreateWebAuthnCredentialRequestOptionsMutation = {
  createWebAuthnCredentialRequestOptions: unknown;
};

export type ICurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type ICurrentUserQuery = {
  me: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  } | null;
};

export type IDeleteUserMutationVariables = Exact<{
  userId?: string | number | null | undefined;
}>;

export type IDeleteUserMutation = { removeUser: { _id: string } };

export type IEnrollUserMutationVariables = Exact<{
  email: string;
  plainPassword?: string | null | undefined;
  profile: Types.IUserProfileInput;
}>;

export type IEnrollUserMutation = {
  enrollUser: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IForgotPasswordMutationVariables = Exact<{
  email: string;
}>;

export type IForgotPasswordMutation = {
  forgotPassword: { success: boolean | null } | null;
};

export type ILoginWithPasswordMutationVariables = Exact<{
  username?: string | null | undefined;
  email?: string | null | undefined;
  password: string;
}>;

export type ILoginWithPasswordMutation = {
  loginWithPassword: {
    _id: string;
    tokenExpires: unknown;
    user: {
      _id: string;
      allowedActions: Array<Types.IRoleAction>;
      roles: Array<string> | null;
    } | null;
  } | null;
};

export type ILoginWithWebAuthnMutationVariables = Exact<{
  webAuthnPublicKeyCredentials: unknown;
}>;

export type ILoginWithWebAuthnMutation = {
  loginWithWebAuthn: { _id: string; tokenExpires: unknown } | null;
};

export type IRemoveEmailMutationVariables = Exact<{
  email: string;
  userId?: string | number | null | undefined;
}>;

export type IRemoveEmailMutation = {
  removeEmail: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IRemoveWeb3AddressMutationVariables = Exact<{
  address: string;
}>;

export type IRemoveWeb3AddressMutation = {
  removeWeb3Address: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IRemoveWebAuthCredentialsMutationVariables = Exact<{
  credentialsId: string | number;
}>;

export type IRemoveWebAuthCredentialsMutation = {
  removeWebAuthnCredentials: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IResetPasswordMutationVariables = Exact<{
  newPlainPassword: string;
  token: string;
}>;

export type IResetPasswordMutation = {
  resetPassword: { _id: string; tokenExpires: unknown } | null;
};

export type ISendVerificationEmailMutationVariables = Exact<{
  email?: string | null | undefined;
}>;

export type ISendVerificationEmailMutation = {
  sendVerificationEmail: { success: boolean | null } | null;
};

export type ISetPasswordMutationVariables = Exact<{
  newPlainPassword: string;
  userId: string | number;
}>;

export type ISetPasswordMutation = {
  setPassword: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type ISetRolesMutationVariables = Exact<{
  roles: Array<string>;
  userId: string | number;
}>;

export type ISetRolesMutation = {
  setRoles: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type ISetUserTagsMutationVariables = Exact<{
  tags: Array<unknown>;
  userId: string | number;
}>;

export type ISetUserTagsMutation = {
  setUserTags: { _id: string; tags: Array<unknown> | null };
};

export type ISetUsernameMutationVariables = Exact<{
  username: string;
  userId: string | number;
}>;

export type ISetUsernameMutation = {
  setUsername: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IPrepareUserAvatarUploadMutationVariables = Exact<{
  mediaName: string;
  userId?: string | number | null | undefined;
}>;

export type IPrepareUserAvatarUploadMutation = {
  prepareUserAvatarUpload: { _id: string; putURL: string; expires: unknown };
};

export type IUpdateUserProfileMutationVariables = Exact<{
  profile: Types.IUserProfileInput;
  userId?: string | number | null | undefined;
}>;

export type IUpdateUserProfileMutation = {
  updateUserProfile: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IUserQueryVariables = Exact<{
  userId?: string | number | null | undefined;
}>;

export type IUserQuery = {
  user: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  } | null;
};

export type IUserWebAuthnCredentialsQueryVariables = Exact<{
  userId: string | number;
}>;

export type IUserWebAuthnCredentialsQuery = {
  user: {
    _id: string;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
  } | null;
};

export type IUsersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeGuests?: boolean | null | undefined;
  queryString?: string | null | undefined;
  lastLogin?: Types.IDateFilterInput | null | undefined;
  emailVerified?: boolean | null | undefined;
  tags?: Array<unknown> | null | undefined;
}>;

export type IUsersQuery = {
  usersCount: number;
  users: Array<{
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  }>;
};

export type IUsersCountQueryVariables = Exact<{
  includeGuests?: boolean | null | undefined;
  queryString?: string | null | undefined;
  lastLogin?: Types.IDateFilterInput | null | undefined;
  emailVerified?: boolean | null | undefined;
}>;

export type IUsersCountQuery = { usersCount: number };

export type IValidateVerifyEmailTokenQueryVariables = Exact<{
  token: string;
}>;

export type IValidateVerifyEmailTokenQuery = {
  validateVerifyEmailToken: boolean;
};

export type IValidateResetPasswordTokenQueryVariables = Exact<{
  token: string;
}>;

export type IValidateResetPasswordTokenQuery = {
  validateResetPasswordToken: boolean;
};

export type IVerifyEmailMutationVariables = Exact<{
  token: string;
}>;

export type IVerifyEmailMutation = {
  verifyEmail: {
    _id: string;
    tokenExpires: unknown;
    user: {
      _id: string;
      allowedActions: Array<Types.IRoleAction>;
      username: string | null;
      isGuest: boolean;
      isInitialPassword: boolean;
      name: string;
      roles: Array<string> | null;
      tags: Array<unknown> | null;
      deleted: unknown;
      lastBillingAddress: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
      lastContact: {
        emailAddress: string | null;
        telNumber: string | null;
      } | null;
      lastLogin: {
        countryCode: string | null;
        locale: unknown;
        remoteAddress: string | null;
        remotePort: number | null;
        timestamp: unknown;
        userAgent: string | null;
      } | null;
      avatar: {
        _id: string;
        name: string;
        size: number;
        type: string;
        url: string | null;
      } | null;
      paymentCredentials: Array<{
        _id: string;
        isValid: boolean;
        isPreferred: boolean;
        paymentProvider: {
          _id: string;
          type: Types.IPaymentProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
        };
      }>;
      emails: Array<{ verified: boolean; address: string }> | null;
      web3Addresses: Array<{
        address: string;
        nonce: string | null;
        verified: boolean;
      }>;
      webAuthnCredentials: Array<{
        _id: string;
        created: unknown;
        aaguid: string;
        counter: number;
        mdsMetadata: {
          legalHeader: string | null;
          description: string | null;
          authenticatorVersion: number | null;
          protocolFamily: string | null;
          schema: number | null;
          authenticationAlgorithms: Array<string> | null;
          publicKeyAlgAndEncodings: Array<string> | null;
          attestationTypes: Array<string> | null;
          keyProtection: Array<string> | null;
          upv: Array<unknown> | null;
          tcDisplay: Array<unknown> | null;
          icon: string | null;
          authenticatorGetInfo: unknown;
        } | null;
      }>;
      profile: {
        displayName: string | null;
        phoneMobile: string | null;
        gender: string | null;
        birthday: unknown;
        address: {
          firstName: string | null;
          lastName: string | null;
          company: string | null;
          addressLine: string | null;
          addressLine2: string | null;
          postalCode: string | null;
          countryCode: string | null;
          regionCode: string | null;
          city: string | null;
        } | null;
      } | null;
      primaryEmail: { verified: boolean; address: string } | null;
      cart: { _id: string; items: Array<{ _id: string }> | null } | null;
      orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
    } | null;
  } | null;
};

export type IVerifyWeb3AddressMutationVariables = Exact<{
  address: string;
  hash: string;
}>;

export type IVerifyWeb3AddressMutation = {
  verifyWeb3Address: {
    _id: string;
    allowedActions: Array<Types.IRoleAction>;
    username: string | null;
    isGuest: boolean;
    isInitialPassword: boolean;
    name: string;
    roles: Array<string> | null;
    tags: Array<unknown> | null;
    deleted: unknown;
    lastBillingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      addressLine2: string | null;
      postalCode: string | null;
      countryCode: string | null;
      regionCode: string | null;
      city: string | null;
    } | null;
    lastContact: {
      emailAddress: string | null;
      telNumber: string | null;
    } | null;
    lastLogin: {
      countryCode: string | null;
      locale: unknown;
      remoteAddress: string | null;
      remotePort: number | null;
      timestamp: unknown;
      userAgent: string | null;
    } | null;
    avatar: {
      _id: string;
      name: string;
      size: number;
      type: string;
      url: string | null;
    } | null;
    paymentCredentials: Array<{
      _id: string;
      isValid: boolean;
      isPreferred: boolean;
      paymentProvider: {
        _id: string;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
    }>;
    emails: Array<{ verified: boolean; address: string }> | null;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    webAuthnCredentials: Array<{
      _id: string;
      created: unknown;
      aaguid: string;
      counter: number;
      mdsMetadata: {
        legalHeader: string | null;
        description: string | null;
        authenticatorVersion: number | null;
        protocolFamily: string | null;
        schema: number | null;
        authenticationAlgorithms: Array<string> | null;
        publicKeyAlgAndEncodings: Array<string> | null;
        attestationTypes: Array<string> | null;
        keyProtection: Array<string> | null;
        upv: Array<unknown> | null;
        tcDisplay: Array<unknown> | null;
        icon: string | null;
        authenticatorGetInfo: unknown;
      } | null;
    }>;
    profile: {
      displayName: string | null;
      phoneMobile: string | null;
      gender: string | null;
      birthday: unknown;
      address: {
        firstName: string | null;
        lastName: string | null;
        company: string | null;
        addressLine: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        countryCode: string | null;
        regionCode: string | null;
        city: string | null;
      } | null;
    } | null;
    primaryEmail: { verified: boolean; address: string } | null;
    cart: { _id: string; items: Array<{ _id: string }> | null } | null;
    orders: Array<{ _id: string; items: Array<{ _id: string }> | null }>;
  };
};

export type IAssortmentChildrenFragment = {
  _id: string;
  childrenCount: number;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
  } | null;
};

export type IAssortmentChildrenFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IAssortmentFragment = {
  _id: string;
  isActive: boolean | null;
  created: unknown;
  updated: unknown;
  sequence: number;
  isRoot: boolean | null;
  tags: Array<unknown> | null;
  childrenCount: number;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

export type IAssortmentFragmentVariables = Exact<{ [key: string]: never }>;

export type IAssortmentLinkFragment = {
  _id: string;
  sortKey: number;
  parent: {
    _id: string;
    isActive: boolean | null;
    created: unknown;
    updated: unknown;
    sequence: number;
    isRoot: boolean | null;
    tags: Array<unknown> | null;
    childrenCount: number;
    texts: {
      _id: string;
      slug: string | null;
      title: string | null;
      subtitle: string | null;
      description: string | null;
    } | null;
    media: Array<{
      _id: string;
      tags: Array<unknown> | null;
      file: { _id: string; url: string | null } | null;
    }>;
  };
  child: {
    _id: string;
    isActive: boolean | null;
    created: unknown;
    updated: unknown;
    sequence: number;
    isRoot: boolean | null;
    tags: Array<unknown> | null;
    childrenCount: number;
    texts: {
      _id: string;
      slug: string | null;
      title: string | null;
      subtitle: string | null;
      description: string | null;
    } | null;
    media: Array<{
      _id: string;
      tags: Array<unknown> | null;
      file: { _id: string; url: string | null } | null;
    }>;
  };
};

export type IAssortmentLinkFragmentVariables = Exact<{ [key: string]: never }>;

export type IAssortmentMediaFragment = {
  _id: string;
  tags: Array<unknown> | null;
  file: { _id: string; url: string | null } | null;
  texts: {
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  } | null;
};

export type IAssortmentMediaFragmentVariables = Exact<{ [key: string]: never }>;

export type IAssortmentMediaTextsFragment = {
  _id: string;
  locale: unknown;
  title: string | null;
  subtitle: string | null;
};

export type IAssortmentMediaTextsFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IAssortmentTextsFragment = {
  _id: string;
  locale: unknown;
  slug: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
};

export type IAssortmentTextsFragmentVariables = Exact<{ [key: string]: never }>;

export type IAddAssortmentFilterMutationVariables = Exact<{
  assortmentId: string | number;
  filterId: string | number;
  tags?: Array<unknown> | null | undefined;
}>;

export type IAddAssortmentFilterMutation = {
  addAssortmentFilter: { _id: string };
};

export type IAddAssortmentLinkMutationVariables = Exact<{
  parentAssortmentId: string | number;
  childAssortmentId: string | number;
  tags?: Array<unknown> | null | undefined;
}>;

export type IAddAssortmentLinkMutation = { addAssortmentLink: { _id: string } };

export type IPrepareAssortmentMediaUploadMutationVariables = Exact<{
  mediaName: string;
  assortmentId: string | number;
}>;

export type IPrepareAssortmentMediaUploadMutation = {
  prepareAssortmentMediaUpload: {
    _id: string;
    putURL: string;
    expires: unknown;
  };
};

export type IAddAssortmentProductMutationVariables = Exact<{
  assortmentId: string | number;
  productId: string | number;
  tags?: Array<unknown> | null | undefined;
}>;

export type IAddAssortmentProductMutation = {
  addAssortmentProduct: { _id: string };
};

export type IAssortmentQueryVariables = Exact<{
  assortmentId?: string | number | null | undefined;
  slug?: string | null | undefined;
  forceLocale?: unknown;
}>;

export type IAssortmentQuery = {
  assortment: {
    _id: string;
    isActive: boolean | null;
    created: unknown;
    updated: unknown;
    sequence: number;
    isRoot: boolean | null;
    tags: Array<unknown> | null;
    childrenCount: number;
    texts: {
      _id: string;
      slug: string | null;
      title: string | null;
      subtitle: string | null;
      description: string | null;
    } | null;
    media: Array<{
      _id: string;
      tags: Array<unknown> | null;
      file: { _id: string; url: string | null } | null;
    }>;
  } | null;
};

export type IAssortmentChildrenQueryVariables = Exact<{
  slugs?: Array<string> | null | undefined;
  includeInactive?: boolean | null | undefined;
  includeLeaves?: boolean | null | undefined;
}>;

export type IAssortmentChildrenQuery = {
  assortments: Array<{
    _id: string;
    childrenCount: number;
    children: Array<{
      _id: string;
      childrenCount: number;
      texts: {
        _id: string;
        slug: string | null;
        title: string | null;
        subtitle: string | null;
      } | null;
    }> | null;
    texts: {
      _id: string;
      slug: string | null;
      title: string | null;
      subtitle: string | null;
    } | null;
  }>;
};

export type IAssortmentFiltersQueryVariables = Exact<{
  assortmentId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IAssortmentFiltersQuery = {
  assortment: {
    _id: string;
    filterAssignments: Array<{
      _id: string;
      sortKey: number;
      tags: Array<unknown> | null;
      filter: {
        _id: string;
        updated: unknown;
        created: unknown;
        key: string | null;
        isActive: boolean | null;
        type: Types.IFilterType | null;
        options: Array<{
          _id: string;
          value: string | null;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
            locale: unknown;
          } | null;
        }> | null;
      };
    }> | null;
  } | null;
};

export type IAssortmentLinksQueryVariables = Exact<{
  assortmentId?: string | number | null | undefined;
  slug?: string | null | undefined;
  forceLocale?: unknown;
}>;

export type IAssortmentLinksQuery = {
  assortment: {
    _id: string;
    linkedAssortments: Array<{
      _id: string;
      sortKey: number;
      parent: {
        _id: string;
        isActive: boolean | null;
        created: unknown;
        updated: unknown;
        sequence: number;
        isRoot: boolean | null;
        tags: Array<unknown> | null;
        childrenCount: number;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      };
      child: {
        _id: string;
        isActive: boolean | null;
        created: unknown;
        updated: unknown;
        sequence: number;
        isRoot: boolean | null;
        tags: Array<unknown> | null;
        childrenCount: number;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      };
    }> | null;
  } | null;
};

export type IAssortmentMediaQueryVariables = Exact<{
  assortmentId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IAssortmentMediaQuery = {
  assortment: {
    _id: string;
    media: Array<{
      _id: string;
      tags: Array<unknown> | null;
      sortKey: number;
      texts: {
        _id: string;
        locale: unknown;
        title: string | null;
        subtitle: string | null;
      } | null;
      file: {
        _id: string;
        url: string | null;
        name: string;
        size: number;
        type: string;
      } | null;
    }>;
  } | null;
};

export type IAssortmentPathsQueryVariables = Exact<{
  assortmentId: string | number;
}>;

export type IAssortmentPathsQuery = {
  assortment: {
    assortmentPaths: Array<{ links: Array<{ assortmentId: string }> }>;
  } | null;
};

export type IAssortmentProductsQueryVariables = Exact<{
  assortmentId?: string | number | null | undefined;
  slug?: string | null | undefined;
  forceLocale?: unknown;
}>;

export type IAssortmentProductsQuery = {
  assortment: {
    _id: string;
    productAssignments: Array<{
      _id: string;
      sortKey: number;
      tags: Array<unknown> | null;
      product:
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
            texts: {
              _id: string;
              slug: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              slug: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            catalogPrice: { amount: number; currencyCode: string } | null;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
            texts: {
              _id: string;
              slug: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            catalogPrice: { amount: number; currencyCode: string } | null;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
            texts: {
              _id: string;
              slug: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              slug: string | null;
              title: string | null;
              subtitle: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          };
    }> | null;
  } | null;
};

export type IAssortmentsQueryVariables = Exact<{
  queryString?: string | null | undefined;
  tags?: Array<unknown> | null | undefined;
  slugs?: Array<string> | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeInactive?: boolean | null | undefined;
  includeLeaves?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  forceLocale?: unknown;
}>;

export type IAssortmentsQuery = {
  assortmentsCount: number;
  assortments: Array<{
    _id: string;
    isActive: boolean | null;
    created: unknown;
    updated: unknown;
    sequence: number;
    isRoot: boolean | null;
    tags: Array<unknown> | null;
    childrenCount: number;
    linkedAssortments: Array<{ child: { _id: string } }> | null;
    texts: {
      _id: string;
      slug: string | null;
      title: string | null;
      subtitle: string | null;
      description: string | null;
    } | null;
    media: Array<{
      _id: string;
      tags: Array<unknown> | null;
      file: { _id: string; url: string | null } | null;
    }>;
  }>;
};

export type IAssortmentsCountQueryVariables = Exact<{
  queryString?: string | null | undefined;
  tags?: Array<unknown> | null | undefined;
  includeInactive?: boolean | null | undefined;
  includeLeaves?: boolean | null | undefined;
}>;

export type IAssortmentsCountQuery = { assortmentsCount: number };

export type IBulkRemoveAssortmentsMutationVariables = Exact<{
  assortmentIds: Array<string | number>;
}>;

export type IBulkRemoveAssortmentsMutation = {
  bulkRemoveAssortments: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkUpdateAssortmentTagsMutationVariables = Exact<{
  assortmentIds: Array<string | number>;
  add?: Array<unknown> | null | undefined;
  remove?: Array<unknown> | null | undefined;
}>;

export type IBulkUpdateAssortmentTagsMutation = {
  bulkUpdateAssortmentTags: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkSetAssortmentActiveMutationVariables = Exact<{
  assortmentIds: Array<string | number>;
  isActive: boolean;
}>;

export type IBulkSetAssortmentActiveMutation = {
  bulkSetAssortmentActive: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type ICreateAssortmentMutationVariables = Exact<{
  assortment: Types.ICreateAssortmentInput;
  texts?: Array<Types.IAssortmentTextInput> | null | undefined;
}>;

export type ICreateAssortmentMutation = { createAssortment: { _id: string } };

export type IRemoveAssortmentMutationVariables = Exact<{
  assortmentId: string | number;
}>;

export type IRemoveAssortmentMutation = { removeAssortment: { _id: string } };

export type IRemoveAssortmentFilterMutationVariables = Exact<{
  assortmentFilterId: string | number;
}>;

export type IRemoveAssortmentFilterMutation = {
  removeAssortmentFilter: { _id: string };
};

export type IRemoveAssortmentLinkMutationVariables = Exact<{
  assortmentLinkId: string | number;
}>;

export type IRemoveAssortmentLinkMutation = {
  removeAssortmentLink: { _id: string };
};

export type IRemoveAssortmentMediaMutationVariables = Exact<{
  assortmentMediaId: string | number;
}>;

export type IRemoveAssortmentMediaMutation = {
  removeAssortmentMedia: { _id: string };
};

export type IRemoveAssortmentProductMutationVariables = Exact<{
  assortmentProductId: string | number;
}>;

export type IRemoveAssortmentProductMutation = {
  removeAssortmentProduct: { _id: string };
};

export type IReorderAssortmentFiltersMutationVariables = Exact<{
  sortKeys: Array<Types.IReorderAssortmentFilterInput>;
}>;

export type IReorderAssortmentFiltersMutation = {
  reorderAssortmentFilters: Array<{ _id: string; sortKey: number }>;
};

export type IReorderAssortmentLinksMutationVariables = Exact<{
  sortKeys: Array<Types.IReorderAssortmentLinkInput>;
}>;

export type IReorderAssortmentLinksMutation = {
  reorderAssortmentLinks: Array<{ _id: string; sortKey: number }>;
};

export type IReorderAssortmentMediaMutationVariables = Exact<{
  sortKeys: Array<Types.IReorderAssortmentMediaInput>;
}>;

export type IReorderAssortmentMediaMutation = {
  reorderAssortmentMedia: Array<{ _id: string; sortKey: number }>;
};

export type IReorderAssortmentProductsMutationVariables = Exact<{
  sortKeys: Array<Types.IReorderAssortmentProductInput>;
}>;

export type IReorderAssortmentProductsMutation = {
  reorderAssortmentProducts: Array<{ _id: string; sortKey: number }>;
};

export type ITranslatedAssortmentMediaTextsQueryVariables = Exact<{
  assortmentMediaId: string | number;
}>;

export type ITranslatedAssortmentMediaTextsQuery = {
  translatedAssortmentMediaTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type ITranslatedAssortmentTextsQueryVariables = Exact<{
  assortmentId: string | number;
}>;

export type ITranslatedAssortmentTextsQuery = {
  translatedAssortmentTexts: Array<{
    _id: string;
    locale: unknown;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
  }>;
};

export type IUpdateAssortmentMutationVariables = Exact<{
  assortment: Types.IUpdateAssortmentInput;
  assortmentId: string | number;
}>;

export type IUpdateAssortmentMutation = { updateAssortment: { _id: string } };

export type IUpdateAssortmentMediaTextsMutationVariables = Exact<{
  assortmentMediaId: string | number;
  texts: Array<Types.IAssortmentMediaTextInput>;
}>;

export type IUpdateAssortmentMediaTextsMutation = {
  updateAssortmentMediaTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type IUpdateAssortmentTextsMutationVariables = Exact<{
  assortmentId: string | number;
  texts: Array<Types.IAssortmentTextInput>;
}>;

export type IUpdateAssortmentTextsMutation = {
  updateAssortmentTexts: Array<{
    _id: string;
    locale: unknown;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
  }>;
};

export type IAddressFragment = {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
  regionCode: string | null;
};

export type IAddressFragmentVariables = Exact<{ [key: string]: never }>;

export type IConfirmMediaUploadMutationVariables = Exact<{
  mediaUploadTicketId: string | number;
  size: number;
  type: string;
}>;

export type IConfirmMediaUploadMutation = {
  confirmMediaUpload: {
    _id: string;
    name: string;
    type: string;
    size: number;
    url: string | null;
  };
};

export type IOrderAnalyticsQueryVariables = Exact<{
  dateRange?: Types.IDateFilterInput | null | undefined;
}>;

export type IOrderAnalyticsQuery = {
  orderStatistics: {
    confirmCount: number;
    confirmRecords: Array<{
      date: string;
      count: number;
      total: { amount: number; currencyCode: string };
    }>;
  };
};

export type IOrdersWithItemsQueryVariables = Exact<{
  limit?: number | null | undefined;
  includeCarts?: boolean | null | undefined;
}>;

export type IOrdersWithItemsQuery = {
  orders: Array<{
    _id: string;
    orderNumber: string | null;
    status: Types.IOrderStatus | null;
    created: unknown;
    updated: unknown;
    ordered: unknown;
    confirmed: unknown;
    fulfilled: unknown;
    totalTax: { amount: number; currencyCode: string } | null;
    itemsTotal: { amount: number; currencyCode: string } | null;
    totalDiscount: { amount: number; currencyCode: string } | null;
    totalPayment: { amount: number; currencyCode: string } | null;
    totalDelivery: { amount: number; currencyCode: string } | null;
    user: {
      _id: string;
      username: string | null;
      isGuest: boolean;
      avatar: { _id: string; url: string | null } | null;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
    } | null;
    discounts: Array<{
      _id: string;
      trigger: Types.IOrderDiscountTrigger;
      code: string | null;
      interface: {
        _id: string;
        label: string | null;
        version: string | null;
      } | null;
      total: {
        amount: number;
        currencyCode: string;
        isTaxable: boolean;
        isNetPrice: boolean;
      };
      discounted: Array<
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
      > | null;
    }> | null;
    payment:
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | null;
    contact: { telNumber: string | null; emailAddress: string | null } | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    billingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      postalCode: string | null;
      city: string | null;
      countryCode: string | null;
      regionCode: string | null;
    } | null;
    delivery:
      | {
          _id: string;
          status: Types.IOrderDeliveryStatus | null;
          delivered: unknown;
          activePickUpLocation: {
            _id: string;
            name: string;
            address: {
              firstName: string | null;
              lastName: string | null;
              company: string | null;
              addressLine: string | null;
              postalCode: string | null;
              city: string | null;
              countryCode: string | null;
              regionCode: string | null;
            } | null;
          } | null;
          provider:
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | null;
          fee: {
            isTaxable: boolean;
            isNetPrice: boolean;
            amount: number;
            currencyCode: string;
          } | null;
          discounts: Array<{
            _id: string;
            orderDiscount: {
              _id: string;
              trigger: Types.IOrderDiscountTrigger;
              code: string | null;
              order: { _id: string; orderNumber: string | null };
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
              total: {
                isTaxable: boolean;
                isNetPrice: boolean;
                amount: number;
                currencyCode: string;
              };
              discounted: Array<
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
              > | null;
            };
          }> | null;
        }
      | {
          _id: string;
          status: Types.IOrderDeliveryStatus | null;
          delivered: unknown;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
          provider:
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | null;
          fee: {
            isTaxable: boolean;
            isNetPrice: boolean;
            amount: number;
            currencyCode: string;
          } | null;
          discounts: Array<{
            _id: string;
            orderDiscount: {
              _id: string;
              trigger: Types.IOrderDiscountTrigger;
              code: string | null;
              order: { _id: string; orderNumber: string | null };
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
              total: {
                isTaxable: boolean;
                isNetPrice: boolean;
                amount: number;
                currencyCode: string;
              };
              discounted: Array<
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
              > | null;
            };
          }> | null;
        }
      | null;
    total: { isTaxable: boolean; amount: number; currencyCode: string } | null;
    items: Array<{
      _id: string;
      quantity: number;
      product:
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          };
      unitPrice: {
        amount: number;
        isTaxable: boolean;
        isNetPrice: boolean;
        currencyCode: string;
      } | null;
      total: {
        amount: number;
        isTaxable: boolean;
        isNetPrice: boolean;
        currencyCode: string;
      } | null;
    }> | null;
  }>;
};

export type IShopStatusQueryVariables = Exact<{ [key: string]: never }>;

export type IShopStatusQuery = {
  countriesCount: number;
  currenciesCount: number;
  languagesCount: number;
  productsCount: number;
  assortmentsCount: number;
  filtersCount: number;
  deliveryProvidersCount: number;
  paymentProvidersCount: number;
};

export type IShopInfoQueryVariables = Exact<{ [key: string]: never }>;

export type IShopInfoQuery = {
  shopInfo: {
    _id: string;
    version: string | null;
    language: {
      _id: string;
      isoCode: string | null;
      name: string | null;
    } | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
      defaultCurrency: { _id: string; isoCode: string } | null;
    } | null;
    adminUiConfig: {
      singleSignOnURL: string | null;
      productTags: Array<string>;
      assortmentTags: Array<string>;
      userTags: Array<string>;
      externalLinks: Array<{
        href: string | null;
        title: string | null;
        target: Types.IExternalLinkTarget | null;
      }>;
      customProperties: Array<{ entityName: string; inlineFragment: string }>;
    };
  };
};

export type IStatusTypesQueryVariables = Exact<{
  enumName: string;
}>;

export type IStatusTypesQuery = {
  statusTypes: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type ISystemRolesQueryVariables = Exact<{ [key: string]: never }>;

export type ISystemRolesQuery = {
  shopInfo: { _id: string; userRoles: Array<string> };
};

export type ICountryFragment = {
  _id: string;
  isoCode: string | null;
  isActive: boolean | null;
  isBase: boolean | null;
  defaultCurrency: { _id: string; isoCode: string } | null;
};

export type ICountryFragmentVariables = Exact<{ [key: string]: never }>;

export type ICountriesQueryVariables = Exact<{
  queryString?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeInactive?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type ICountriesQuery = {
  countriesCount: number;
  countries: Array<{
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    defaultCurrency: { _id: string; isoCode: string } | null;
  }>;
};

export type ICountryQueryVariables = Exact<{
  countryId: string | number;
}>;

export type ICountryQuery = {
  country: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    defaultCurrency: { _id: string; isoCode: string } | null;
  } | null;
};

export type ICreateCountryMutationVariables = Exact<{
  country: Types.ICreateCountryInput;
}>;

export type ICreateCountryMutation = {
  createCountry: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    defaultCurrency: { _id: string; isoCode: string } | null;
  };
};

export type IRemoveCountryMutationVariables = Exact<{
  countryId: string | number;
}>;

export type IRemoveCountryMutation = {
  removeCountry: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    defaultCurrency: { _id: string; isoCode: string } | null;
  };
};

export type IUpdateCountryMutationVariables = Exact<{
  country: Types.IUpdateCountryInput;
  countryId: string | number;
}>;

export type IUpdateCountryMutation = {
  updateCountry: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    defaultCurrency: { _id: string; isoCode: string } | null;
  };
};

export type ICurrencyFragment = {
  _id: string;
  isoCode: string;
  isActive: boolean | null;
  contractAddress: string | null;
  decimals: number | null;
};

export type ICurrencyFragmentVariables = Exact<{ [key: string]: never }>;

export type ICreateCurrencyMutationVariables = Exact<{
  currency: Types.ICreateCurrencyInput;
}>;

export type ICreateCurrencyMutation = {
  createCurrency: {
    _id: string;
    isoCode: string;
    isActive: boolean | null;
    contractAddress: string | null;
    decimals: number | null;
  };
};

export type ICurrenciesQueryVariables = Exact<{
  queryString?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeInactive?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type ICurrenciesQuery = {
  currenciesCount: number;
  currencies: Array<{
    _id: string;
    isoCode: string;
    isActive: boolean | null;
    contractAddress: string | null;
    decimals: number | null;
  }>;
};

export type ICurrencyQueryVariables = Exact<{
  currencyId: string | number;
}>;

export type ICurrencyQuery = {
  currency: {
    _id: string;
    isoCode: string;
    isActive: boolean | null;
    contractAddress: string | null;
    decimals: number | null;
  } | null;
};

export type IRemoveCurrencyMutationVariables = Exact<{
  currencyId: string | number;
}>;

export type IRemoveCurrencyMutation = {
  removeCurrency: {
    _id: string;
    isoCode: string;
    isActive: boolean | null;
    contractAddress: string | null;
    decimals: number | null;
  };
};

export type IUpdateCurrencyMutationVariables = Exact<{
  currency: Types.IUpdateCurrencyInput;
  currencyId: string | number;
}>;

export type IUpdateCurrencyMutation = {
  updateCurrency: {
    _id: string;
    isoCode: string;
    isActive: boolean | null;
    contractAddress: string | null;
    decimals: number | null;
  };
};

export type ICreateDeliveryProviderMutationVariables = Exact<{
  deliveryProvider: Types.ICreateDeliveryProviderInput;
}>;

export type ICreateDeliveryProviderMutation = {
  createDeliveryProvider:
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        pickUpLocations: Array<{
          _id: string;
          name: string;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
        }>;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
};

export type IDeliveryInterfacesQueryVariables = Exact<{
  providerType?: Types.IDeliveryProviderType | null | undefined;
}>;

export type IDeliveryInterfacesQuery = {
  deliveryInterfaces: Array<{
    _id: string;
    label: string | null;
    value: string;
  }>;
};

export type IDeliveryProviderQueryVariables = Exact<{
  deliveryProviderId: string | number;
}>;

export type IDeliveryProviderQuery = {
  deliveryProvider:
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        pickUpLocations: Array<{
          _id: string;
          name: string;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
        }>;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
    | null;
};

export type IDeliveryProvidersTypeQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IDeliveryProvidersTypeQuery = {
  deliveryProviderType: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type IDeliveryProvidersQueryVariables = Exact<{
  type?: Types.IDeliveryProviderType | null | undefined;
}>;

export type IDeliveryProvidersQuery = {
  deliveryProvidersCount: number;
  deliveryProviders: Array<
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        pickUpLocations: Array<{
          _id: string;
          name: string;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
        }>;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
  >;
};

export type IRemoveDeliveryProviderMutationVariables = Exact<{
  deliveryProviderId: string | number;
}>;

export type IRemoveDeliveryProviderMutation = {
  removeDeliveryProvider: { _id: string } | { _id: string };
};

export type IUpdateDeliveryProviderMutationVariables = Exact<{
  deliveryProvider: Types.IUpdateProviderInput;
  deliveryProviderId: string | number;
}>;

export type IUpdateDeliveryProviderMutation = {
  updateDeliveryProvider:
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        pickUpLocations: Array<{
          _id: string;
          name: string;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
        }>;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      }
    | {
        _id: string;
        created: unknown;
        updated: unknown;
        deleted: unknown;
        type: Types.IDeliveryProviderType | null;
        isActive: boolean | null;
        configuration: unknown;
        configurationError: Types.IDeliveryProviderError | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      };
};

export type IEnrollmentDetailFragment = {
  _id: string;
  enrollmentNumber: string | null;
  updated: unknown;
  status: Types.IEnrollmentStatus;
  created: unknown;
  expires: unknown;
  isExpired: boolean | null;
  country: { _id: string; isoCode: string | null } | null;
  billingAddress: {
    addressLine: string | null;
    addressLine2: string | null;
    city: string | null;
    company: string | null;
    countryCode: string | null;
    firstName: string | null;
    lastName: string | null;
    postalCode: string | null;
    regionCode: string | null;
  } | null;
  contact: { emailAddress: string | null; telNumber: string | null } | null;
  currency: {
    _id: string;
    contractAddress: string | null;
    decimals: number | null;
    isActive: boolean | null;
    isoCode: string;
  } | null;
  delivery: {
    provider:
      | {
          _id: string;
          configuration: unknown;
          configurationError: Types.IDeliveryProviderError | null;
          isActive: boolean | null;
          type: Types.IDeliveryProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
          simulatedPrice: {
            amount: number;
            currencyCode: string;
            isNetPrice: boolean;
            isTaxable: boolean;
          } | null;
        }
      | {
          _id: string;
          configuration: unknown;
          configurationError: Types.IDeliveryProviderError | null;
          isActive: boolean | null;
          type: Types.IDeliveryProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
          simulatedPrice: {
            amount: number;
            currencyCode: string;
            isNetPrice: boolean;
            isTaxable: boolean;
          } | null;
        }
      | null;
  } | null;
  payment: {
    provider: {
      _id: string;
      configuration: unknown;
      configurationError: Types.IPaymentProviderError | null;
      isActive: boolean | null;
      type: Types.IPaymentProviderType | null;
      interface: {
        _id: string;
        label: string | null;
        version: string | null;
      } | null;
    } | null;
  } | null;
  periods: Array<{
    end: unknown;
    isTrial: boolean;
    start: unknown;
    order: { _id: string } | null;
  }>;
  plan: {
    quantity: number;
    configuration: Array<{ key: string; value: string }> | null;
    product: {
      _id: string;
      texts: { _id: string; title: string | null } | null;
    };
  };
  user: {
    _id: string;
    username: string | null;
    name: string;
    avatar: { _id: string; url: string | null } | null;
  };
};

export type IEnrollmentDetailFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IEnrollmentFragment = {
  _id: string;
  enrollmentNumber: string | null;
  updated: unknown;
  status: Types.IEnrollmentStatus;
  created: unknown;
  expires: unknown;
  isExpired: boolean | null;
  country: { _id: string; isoCode: string | null } | null;
  currency: { _id: string; isoCode: string } | null;
  periods: Array<{ start: unknown; end: unknown; isTrial: boolean }>;
  payment: { provider: { _id: string } | null } | null;
  delivery: { provider: { _id: string } | { _id: string } | null } | null;
  plan: {
    quantity: number;
    product: {
      _id: string;
      media: Array<{
        _id: string;
        file: { _id: string; url: string | null } | null;
      }>;
      texts: { _id: string; title: string | null } | null;
    };
  };
  user: {
    _id: string;
    username: string | null;
    name: string;
    avatar: { _id: string; url: string | null } | null;
  };
};

export type IEnrollmentFragmentVariables = Exact<{ [key: string]: never }>;

export type IActivateEnrollmentMutationVariables = Exact<{
  enrollmentId: string | number;
}>;

export type IActivateEnrollmentMutation = {
  activateEnrollment: { _id: string };
};

export type IEnrollmentQueryVariables = Exact<{
  enrollmentId: string | number;
}>;

export type IEnrollmentQuery = {
  enrollment: {
    _id: string;
    enrollmentNumber: string | null;
    updated: unknown;
    status: Types.IEnrollmentStatus;
    created: unknown;
    expires: unknown;
    isExpired: boolean | null;
    country: { _id: string; isoCode: string | null } | null;
    billingAddress: {
      addressLine: string | null;
      addressLine2: string | null;
      city: string | null;
      company: string | null;
      countryCode: string | null;
      firstName: string | null;
      lastName: string | null;
      postalCode: string | null;
      regionCode: string | null;
    } | null;
    contact: { emailAddress: string | null; telNumber: string | null } | null;
    currency: {
      _id: string;
      contractAddress: string | null;
      decimals: number | null;
      isActive: boolean | null;
      isoCode: string;
    } | null;
    delivery: {
      provider:
        | {
            _id: string;
            configuration: unknown;
            configurationError: Types.IDeliveryProviderError | null;
            isActive: boolean | null;
            type: Types.IDeliveryProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
            simulatedPrice: {
              amount: number;
              currencyCode: string;
              isNetPrice: boolean;
              isTaxable: boolean;
            } | null;
          }
        | {
            _id: string;
            configuration: unknown;
            configurationError: Types.IDeliveryProviderError | null;
            isActive: boolean | null;
            type: Types.IDeliveryProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
            simulatedPrice: {
              amount: number;
              currencyCode: string;
              isNetPrice: boolean;
              isTaxable: boolean;
            } | null;
          }
        | null;
    } | null;
    payment: {
      provider: {
        _id: string;
        configuration: unknown;
        configurationError: Types.IPaymentProviderError | null;
        isActive: boolean | null;
        type: Types.IPaymentProviderType | null;
        interface: {
          _id: string;
          label: string | null;
          version: string | null;
        } | null;
      } | null;
    } | null;
    periods: Array<{
      end: unknown;
      isTrial: boolean;
      start: unknown;
      order: { _id: string } | null;
    }>;
    plan: {
      quantity: number;
      configuration: Array<{ key: string; value: string }> | null;
      product: {
        _id: string;
        texts: { _id: string; title: string | null } | null;
      };
    };
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
    };
  } | null;
};

export type IEnrollmentsQueryVariables = Exact<{
  offset?: number | null | undefined;
  limit?: number | null | undefined;
  queryString?: string | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  status?: Array<string> | null | undefined;
}>;

export type IEnrollmentsQuery = {
  enrollmentsCount: number;
  enrollments: Array<{
    _id: string;
    enrollmentNumber: string | null;
    updated: unknown;
    status: Types.IEnrollmentStatus;
    created: unknown;
    expires: unknown;
    isExpired: boolean | null;
    country: { _id: string; isoCode: string | null } | null;
    currency: { _id: string; isoCode: string } | null;
    periods: Array<{ start: unknown; end: unknown; isTrial: boolean }>;
    payment: { provider: { _id: string } | null } | null;
    delivery: { provider: { _id: string } | { _id: string } | null } | null;
    plan: {
      quantity: number;
      product: {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
        texts: { _id: string; title: string | null } | null;
      };
    };
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
    };
  }>;
};

export type ISendEnrollmentEmailMutationVariables = Exact<{
  email: string;
}>;

export type ISendEnrollmentEmailMutation = {
  sendEnrollmentEmail: { success: boolean | null } | null;
};

export type ITerminateEnrollmentMutationVariables = Exact<{
  enrollmentId: string | number;
}>;

export type ITerminateEnrollmentMutation = {
  terminateEnrollment: { _id: string };
};

export type IUserEnrollmentsQueryVariables = Exact<{
  userId: string | number;
  queryString?: string | null | undefined;
}>;

export type IUserEnrollmentsQuery = {
  user: {
    _id: string;
    enrollments: Array<{
      _id: string;
      enrollmentNumber: string | null;
      updated: unknown;
      status: Types.IEnrollmentStatus;
      created: unknown;
      expires: unknown;
      isExpired: boolean | null;
      country: { _id: string; isoCode: string | null } | null;
      currency: { _id: string; isoCode: string } | null;
      periods: Array<{ start: unknown; end: unknown; isTrial: boolean }>;
      payment: { provider: { _id: string } | null } | null;
      delivery: { provider: { _id: string } | { _id: string } | null } | null;
      plan: {
        quantity: number;
        product: {
          _id: string;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
          texts: { _id: string; title: string | null } | null;
        };
      };
      user: {
        _id: string;
        username: string | null;
        name: string;
        avatar: { _id: string; url: string | null } | null;
      };
    }>;
  } | null;
};

export type IEventFragment = {
  _id: string;
  type: string;
  payload: unknown;
  created: unknown;
};

export type IEventFragmentVariables = Exact<{ [key: string]: never }>;

export type IEventQueryVariables = Exact<{
  eventId: string | number;
}>;

export type IEventQuery = {
  event: {
    _id: string;
    type: string;
    payload: unknown;
    created: unknown;
  } | null;
};

export type IRegisteredEventTypesQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IRegisteredEventTypesQuery = {
  registeredEventTypes: Array<string>;
};

export type IEventsQueryVariables = Exact<{
  types?: Array<string> | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  queryString?: string | null | undefined;
  created?: Types.IDateFilterInput | null | undefined;
}>;

export type IEventsQuery = {
  eventsCount: number;
  events: Array<{
    _id: string;
    type: string;
    payload: unknown;
    created: unknown;
  }>;
};

export type IFilterFragment = {
  _id: string;
  updated: unknown;
  created: unknown;
  key: string | null;
  isActive: boolean | null;
  type: Types.IFilterType | null;
  options: Array<{
    _id: string;
    value: string | null;
    texts: {
      _id: string;
      title: string | null;
      subtitle: string | null;
      locale: unknown;
    } | null;
  }> | null;
};

export type IFilterFragmentVariables = Exact<{ [key: string]: never }>;

export type IFilterOptionFragment = {
  _id: string;
  value: string | null;
  texts: {
    _id: string;
    title: string | null;
    subtitle: string | null;
    locale: unknown;
  } | null;
};

export type IFilterOptionFragmentVariables = Exact<{ [key: string]: never }>;

export type IFilterTextsFragment = {
  _id: string;
  locale: unknown;
  title: string | null;
  subtitle: string | null;
};

export type IFilterTextsFragmentVariables = Exact<{ [key: string]: never }>;

export type IBulkRemoveFiltersMutationVariables = Exact<{
  filterIds: Array<string | number>;
}>;

export type IBulkRemoveFiltersMutation = {
  bulkRemoveFilters: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkSetFilterActiveMutationVariables = Exact<{
  filterIds: Array<string | number>;
  isActive: boolean;
}>;

export type IBulkSetFilterActiveMutation = {
  bulkSetFilterActive: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type ICreateFilterMutationVariables = Exact<{
  filter: Types.ICreateFilterInput;
  texts: Array<Types.IFilterTextInput>;
}>;

export type ICreateFilterMutation = {
  createFilter: {
    _id: string;
    updated: unknown;
    created: unknown;
    key: string | null;
    isActive: boolean | null;
    type: Types.IFilterType | null;
    options: Array<{
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
        locale: unknown;
      } | null;
    }> | null;
  };
};

export type ICreateFilterOptionMutationVariables = Exact<{
  filterId: string | number;
  option: string;
  texts?: Array<Types.IFilterTextInput> | null | undefined;
}>;

export type ICreateFilterOptionMutation = {
  createFilterOption: { _id: string };
};

export type IFilterQueryVariables = Exact<{
  filterId?: string | number | null | undefined;
}>;

export type IFilterQuery = {
  filter: {
    _id: string;
    updated: unknown;
    created: unknown;
    key: string | null;
    isActive: boolean | null;
    type: Types.IFilterType | null;
    texts: {
      _id: string;
      title: string | null;
      subtitle: string | null;
      locale: unknown;
    } | null;
    options: Array<{
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
        locale: unknown;
      } | null;
    }> | null;
  } | null;
};

export type IFilterOptionsQueryVariables = Exact<{
  filterId?: string | number | null | undefined;
  forceLocale?: unknown;
}>;

export type IFilterOptionsQuery = {
  filter: {
    _id: string;
    options: Array<{
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
        locale: unknown;
      } | null;
    }> | null;
  } | null;
};

export type IFilterTypesQueryVariables = Exact<{ [key: string]: never }>;

export type IFilterTypesQuery = {
  filterTypes: {
    options: Array<{ label: string; value: string }> | null;
  } | null;
};

export type IFiltersQueryVariables = Exact<{
  queryString?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeInactive?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type IFiltersQuery = {
  filtersCount: number;
  filters: Array<{
    _id: string;
    updated: unknown;
    created: unknown;
    key: string | null;
    isActive: boolean | null;
    type: Types.IFilterType | null;
    texts: {
      _id: string;
      title: string | null;
      subtitle: string | null;
      locale: unknown;
    } | null;
    options: Array<{
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
        locale: unknown;
      } | null;
    }> | null;
  }>;
};

export type IFiltersCountQueryVariables = Exact<{
  queryString?: string | null | undefined;
  includeInactive?: boolean | null | undefined;
}>;

export type IFiltersCountQuery = { filtersCount: number };

export type IRemoveFilterMutationVariables = Exact<{
  filterId: string | number;
}>;

export type IRemoveFilterMutation = { removeFilter: { _id: string } };

export type IRemoveFilterOptionMutationVariables = Exact<{
  filterId: string | number;
  filterOptionValue: string;
}>;

export type IRemoveFilterOptionMutation = {
  removeFilterOption: { _id: string };
};

export type ITranslatedFilterTextsQueryVariables = Exact<{
  filterId: string | number;
  filterOptionValue?: string | null | undefined;
}>;

export type ITranslatedFilterTextsQuery = {
  translatedFilterTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type IUpdateFilterMutationVariables = Exact<{
  filter: Types.IUpdateFilterInput;
  filterId: string | number;
}>;

export type IUpdateFilterMutation = {
  updateFilter: {
    _id: string;
    updated: unknown;
    created: unknown;
    key: string | null;
    isActive: boolean | null;
    type: Types.IFilterType | null;
    options: Array<{
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
        locale: unknown;
      } | null;
    }> | null;
  };
};

export type IUpdateFilterTextsMutationVariables = Exact<{
  filterId: string | number;
  filterOptionValue?: string | null | undefined;
  texts: Array<Types.IFilterTextInput>;
}>;

export type IUpdateFilterTextsMutation = {
  updateFilterTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type ILanguageFragment = {
  _id: string;
  isoCode: string | null;
  isActive: boolean | null;
  isBase: boolean | null;
  name: string | null;
};

export type ILanguageFragmentVariables = Exact<{ [key: string]: never }>;

export type ICreateLanguageMutationVariables = Exact<{
  language: Types.ICreateLanguageInput;
}>;

export type ICreateLanguageMutation = {
  createLanguage: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    name: string | null;
  };
};

export type ILanguageQueryVariables = Exact<{
  languageId: string | number;
}>;

export type ILanguageQuery = {
  language: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    name: string | null;
  } | null;
};

export type ILanguagesQueryVariables = Exact<{
  queryString?: string | null | undefined;
  offset?: number | null | undefined;
  limit?: number | null | undefined;
  includeInactive?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type ILanguagesQuery = {
  languagesCount: number;
  languages: Array<{
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    name: string | null;
  } | null>;
};

export type IRemoveLanguageMutationVariables = Exact<{
  languageId: string | number;
}>;

export type IRemoveLanguageMutation = {
  removeLanguage: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    name: string | null;
  };
};

export type IUpdateLanguageMutationVariables = Exact<{
  language: Types.IUpdateLanguageInput;
  languageId: string | number;
}>;

export type IUpdateLanguageMutation = {
  updateLanguage: {
    _id: string;
    isoCode: string | null;
    isActive: boolean | null;
    isBase: boolean | null;
    name: string | null;
  };
};

export type IOrderDetailFragment = {
  _id: string;
  orderNumber: string | null;
  status: Types.IOrderStatus | null;
  created: unknown;
  updated: unknown;
  ordered: unknown;
  confirmed: unknown;
  fulfilled: unknown;
  totalTax: { amount: number; currencyCode: string } | null;
  itemsTotal: { amount: number; currencyCode: string } | null;
  totalDiscount: { amount: number; currencyCode: string } | null;
  totalPayment: { amount: number; currencyCode: string } | null;
  totalDelivery: { amount: number; currencyCode: string } | null;
  user: {
    _id: string;
    username: string | null;
    isGuest: boolean;
    avatar: { _id: string; url: string | null } | null;
    profile: {
      displayName: string | null;
      address: { firstName: string | null; lastName: string | null } | null;
    } | null;
  } | null;
  discounts: Array<{
    _id: string;
    trigger: Types.IOrderDiscountTrigger;
    code: string | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
    total: {
      amount: number;
      currencyCode: string;
      isTaxable: boolean;
      isNetPrice: boolean;
    };
    discounted: Array<
      | {
          _id: string;
          orderDiscount: {
            _id: string;
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          };
          total: {
            amount: number;
            currencyCode: string;
            isTaxable: boolean;
            isNetPrice: boolean;
          };
        }
      | {
          _id: string;
          orderDiscount: {
            _id: string;
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          };
          total: {
            amount: number;
            currencyCode: string;
            isTaxable: boolean;
            isNetPrice: boolean;
          };
        }
      | {
          _id: string;
          orderDiscount: {
            _id: string;
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          };
          total: {
            amount: number;
            currencyCode: string;
            isTaxable: boolean;
            isNetPrice: boolean;
          };
        }
      | {
          _id: string;
          orderDiscount: {
            _id: string;
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          };
          total: {
            amount: number;
            currencyCode: string;
            isTaxable: boolean;
            isNetPrice: boolean;
          };
        }
    > | null;
  }> | null;
  payment:
    | {
        _id: string;
        status: Types.IOrderPaymentStatus | null;
        paid: unknown;
        provider: {
          _id: string;
          type: Types.IPaymentProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
        } | null;
        fee: { currencyCode: string; amount: number } | null;
      }
    | {
        _id: string;
        status: Types.IOrderPaymentStatus | null;
        paid: unknown;
        provider: {
          _id: string;
          type: Types.IPaymentProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
        } | null;
        fee: { currencyCode: string; amount: number } | null;
      }
    | {
        _id: string;
        status: Types.IOrderPaymentStatus | null;
        paid: unknown;
        provider: {
          _id: string;
          type: Types.IPaymentProviderType | null;
          interface: {
            _id: string;
            label: string | null;
            version: string | null;
          } | null;
        } | null;
        fee: { currencyCode: string; amount: number } | null;
      }
    | null;
  contact: { telNumber: string | null; emailAddress: string | null } | null;
  country: {
    _id: string;
    isoCode: string | null;
    flagEmoji: string | null;
    name: string | null;
  } | null;
  currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
  billingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    addressLine: string | null;
    postalCode: string | null;
    city: string | null;
    countryCode: string | null;
    regionCode: string | null;
  } | null;
  delivery:
    | {
        _id: string;
        status: Types.IOrderDeliveryStatus | null;
        delivered: unknown;
        activePickUpLocation: {
          _id: string;
          name: string;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
        } | null;
        provider:
          | {
              _id: string;
              created: unknown;
              updated: unknown;
              deleted: unknown;
              type: Types.IDeliveryProviderType | null;
              configuration: unknown;
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
            }
          | {
              _id: string;
              created: unknown;
              updated: unknown;
              deleted: unknown;
              type: Types.IDeliveryProviderType | null;
              configuration: unknown;
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
            }
          | null;
        fee: {
          isTaxable: boolean;
          isNetPrice: boolean;
          amount: number;
          currencyCode: string;
        } | null;
        discounts: Array<{
          _id: string;
          orderDiscount: {
            _id: string;
            trigger: Types.IOrderDiscountTrigger;
            code: string | null;
            order: { _id: string; orderNumber: string | null };
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
            total: {
              isTaxable: boolean;
              isNetPrice: boolean;
              amount: number;
              currencyCode: string;
            };
            discounted: Array<
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
            > | null;
          };
        }> | null;
      }
    | {
        _id: string;
        status: Types.IOrderDeliveryStatus | null;
        delivered: unknown;
        address: {
          firstName: string | null;
          lastName: string | null;
          company: string | null;
          addressLine: string | null;
          postalCode: string | null;
          city: string | null;
          countryCode: string | null;
          regionCode: string | null;
        } | null;
        provider:
          | {
              _id: string;
              created: unknown;
              updated: unknown;
              deleted: unknown;
              type: Types.IDeliveryProviderType | null;
              configuration: unknown;
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
            }
          | {
              _id: string;
              created: unknown;
              updated: unknown;
              deleted: unknown;
              type: Types.IDeliveryProviderType | null;
              configuration: unknown;
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
            }
          | null;
        fee: {
          isTaxable: boolean;
          isNetPrice: boolean;
          amount: number;
          currencyCode: string;
        } | null;
        discounts: Array<{
          _id: string;
          orderDiscount: {
            _id: string;
            trigger: Types.IOrderDiscountTrigger;
            code: string | null;
            order: { _id: string; orderNumber: string | null };
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
            total: {
              isTaxable: boolean;
              isNetPrice: boolean;
              amount: number;
              currencyCode: string;
            };
            discounted: Array<
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
              | {
                  _id: string;
                  orderDiscount: {
                    _id: string;
                    trigger: Types.IOrderDiscountTrigger;
                    code: string | null;
                    order: { _id: string; orderNumber: string | null };
                    interface: {
                      _id: string;
                      label: string | null;
                      version: string | null;
                    } | null;
                    total: {
                      isTaxable: boolean;
                      isNetPrice: boolean;
                      amount: number;
                      currencyCode: string;
                    };
                  };
                }
            > | null;
          };
        }> | null;
      }
    | null;
  total: { isTaxable: boolean; amount: number; currencyCode: string } | null;
  items: Array<{
    _id: string;
    quantity: number;
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            brand: string | null;
            vendor: string | null;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            brand: string | null;
            vendor: string | null;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            brand: string | null;
            vendor: string | null;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            brand: string | null;
            vendor: string | null;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            brand: string | null;
            vendor: string | null;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        };
    unitPrice: {
      amount: number;
      isTaxable: boolean;
      isNetPrice: boolean;
      currencyCode: string;
    } | null;
    total: {
      amount: number;
      isTaxable: boolean;
      isNetPrice: boolean;
      currencyCode: string;
    } | null;
  }> | null;
};

export type IOrderDetailFragmentVariables = Exact<{ [key: string]: never }>;

export type IOrderFragment = {
  _id: string;
  status: Types.IOrderStatus | null;
  created: unknown;
  updated: unknown;
  ordered: unknown;
  orderNumber: string | null;
  confirmed: unknown;
  fulfilled: unknown;
  contact: { telNumber: string | null; emailAddress: string | null } | null;
  total: {
    isTaxable: boolean;
    isNetPrice: boolean;
    amount: number;
    currencyCode: string;
  } | null;
  user: {
    _id: string;
    username: string | null;
    isGuest: boolean;
    avatar: { _id: string; url: string | null } | null;
    profile: {
      displayName: string | null;
      address: { firstName: string | null; lastName: string | null } | null;
    } | null;
  } | null;
};

export type IOrderFragmentVariables = Exact<{ [key: string]: never }>;

export type IConfirmOrderMutationVariables = Exact<{
  orderId: string | number;
}>;

export type IConfirmOrderMutation = { confirmOrder: { _id: string } };

export type IDeliverOrderMutationVariables = Exact<{
  orderId: string | number;
}>;

export type IDeliverOrderMutation = { deliverOrder: { _id: string } };

export type IOrderQueryVariables = Exact<{
  orderId: string | number;
}>;

export type IOrderQuery = {
  order: {
    _id: string;
    orderNumber: string | null;
    status: Types.IOrderStatus | null;
    created: unknown;
    updated: unknown;
    ordered: unknown;
    confirmed: unknown;
    fulfilled: unknown;
    totalTax: { amount: number; currencyCode: string } | null;
    itemsTotal: { amount: number; currencyCode: string } | null;
    totalDiscount: { amount: number; currencyCode: string } | null;
    totalPayment: { amount: number; currencyCode: string } | null;
    totalDelivery: { amount: number; currencyCode: string } | null;
    user: {
      _id: string;
      username: string | null;
      isGuest: boolean;
      avatar: { _id: string; url: string | null } | null;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
    } | null;
    discounts: Array<{
      _id: string;
      trigger: Types.IOrderDiscountTrigger;
      code: string | null;
      interface: {
        _id: string;
        label: string | null;
        version: string | null;
      } | null;
      total: {
        amount: number;
        currencyCode: string;
        isTaxable: boolean;
        isNetPrice: boolean;
      };
      discounted: Array<
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
        | {
            _id: string;
            orderDiscount: {
              _id: string;
              total: {
                amount: number;
                currencyCode: string;
                isTaxable: boolean;
                isNetPrice: boolean;
              };
            };
            total: {
              amount: number;
              currencyCode: string;
              isTaxable: boolean;
              isNetPrice: boolean;
            };
          }
      > | null;
    }> | null;
    payment:
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | {
          _id: string;
          status: Types.IOrderPaymentStatus | null;
          paid: unknown;
          provider: {
            _id: string;
            type: Types.IPaymentProviderType | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
          fee: { currencyCode: string; amount: number } | null;
        }
      | null;
    contact: { telNumber: string | null; emailAddress: string | null } | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    billingAddress: {
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      addressLine: string | null;
      postalCode: string | null;
      city: string | null;
      countryCode: string | null;
      regionCode: string | null;
    } | null;
    delivery:
      | {
          _id: string;
          status: Types.IOrderDeliveryStatus | null;
          delivered: unknown;
          activePickUpLocation: {
            _id: string;
            name: string;
            address: {
              firstName: string | null;
              lastName: string | null;
              company: string | null;
              addressLine: string | null;
              postalCode: string | null;
              city: string | null;
              countryCode: string | null;
              regionCode: string | null;
            } | null;
          } | null;
          provider:
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | null;
          fee: {
            isTaxable: boolean;
            isNetPrice: boolean;
            amount: number;
            currencyCode: string;
          } | null;
          discounts: Array<{
            _id: string;
            orderDiscount: {
              _id: string;
              trigger: Types.IOrderDiscountTrigger;
              code: string | null;
              order: { _id: string; orderNumber: string | null };
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
              total: {
                isTaxable: boolean;
                isNetPrice: boolean;
                amount: number;
                currencyCode: string;
              };
              discounted: Array<
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
              > | null;
            };
          }> | null;
        }
      | {
          _id: string;
          status: Types.IOrderDeliveryStatus | null;
          delivered: unknown;
          address: {
            firstName: string | null;
            lastName: string | null;
            company: string | null;
            addressLine: string | null;
            postalCode: string | null;
            city: string | null;
            countryCode: string | null;
            regionCode: string | null;
          } | null;
          provider:
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | {
                _id: string;
                created: unknown;
                updated: unknown;
                deleted: unknown;
                type: Types.IDeliveryProviderType | null;
                configuration: unknown;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | null;
          fee: {
            isTaxable: boolean;
            isNetPrice: boolean;
            amount: number;
            currencyCode: string;
          } | null;
          discounts: Array<{
            _id: string;
            orderDiscount: {
              _id: string;
              trigger: Types.IOrderDiscountTrigger;
              code: string | null;
              order: { _id: string; orderNumber: string | null };
              interface: {
                _id: string;
                label: string | null;
                version: string | null;
              } | null;
              total: {
                isTaxable: boolean;
                isNetPrice: boolean;
                amount: number;
                currencyCode: string;
              };
              discounted: Array<
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
                | {
                    _id: string;
                    orderDiscount: {
                      _id: string;
                      trigger: Types.IOrderDiscountTrigger;
                      code: string | null;
                      order: { _id: string; orderNumber: string | null };
                      interface: {
                        _id: string;
                        label: string | null;
                        version: string | null;
                      } | null;
                      total: {
                        isTaxable: boolean;
                        isNetPrice: boolean;
                        amount: number;
                        currencyCode: string;
                      };
                    };
                  }
              > | null;
            };
          }> | null;
        }
      | null;
    total: { isTaxable: boolean; amount: number; currencyCode: string } | null;
    items: Array<{
      _id: string;
      quantity: number;
      product:
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              brand: string | null;
              vendor: string | null;
              title: string | null;
              subtitle: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; url: string | null } | null;
            }>;
          };
      unitPrice: {
        amount: number;
        isTaxable: boolean;
        isNetPrice: boolean;
        currencyCode: string;
      } | null;
      total: {
        amount: number;
        isTaxable: boolean;
        isNetPrice: boolean;
        currencyCode: string;
      } | null;
    }> | null;
  } | null;
};

export type IOrdersQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeCarts?: boolean | null | undefined;
  queryString?: string | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  paymentProviderIds?: Array<string> | null | undefined;
  deliveryProviderIds?: Array<string> | null | undefined;
  dateRange?: Types.IDateFilterInput | null | undefined;
  status?: Array<Types.IOrderStatus> | null | undefined;
}>;

export type IOrdersQuery = {
  ordersCount: number;
  orders: Array<{
    _id: string;
    status: Types.IOrderStatus | null;
    created: unknown;
    updated: unknown;
    ordered: unknown;
    orderNumber: string | null;
    confirmed: unknown;
    fulfilled: unknown;
    contact: { telNumber: string | null; emailAddress: string | null } | null;
    total: {
      isTaxable: boolean;
      isNetPrice: boolean;
      amount: number;
      currencyCode: string;
    } | null;
    user: {
      _id: string;
      username: string | null;
      isGuest: boolean;
      avatar: { _id: string; url: string | null } | null;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
    } | null;
  }>;
};

export type IPayOrderMutationVariables = Exact<{
  orderId: string | number;
}>;

export type IPayOrderMutation = { payOrder: { _id: string } };

export type IRejectOrderMutationVariables = Exact<{
  orderId: string | number;
}>;

export type IRejectOrderMutation = { rejectOrder: { _id: string } };

export type IRemoveOrderMutationVariables = Exact<{
  orderId: string | number;
}>;

export type IRemoveOrderMutation = { removeOrder: { _id: string } };

export type IUserOrderQueryVariables = Exact<{
  userId?: string | number | null | undefined;
  queryString?: string | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  includeCarts?: boolean | null | undefined;
}>;

export type IUserOrderQuery = {
  user: {
    orders: Array<{
      _id: string;
      status: Types.IOrderStatus | null;
      created: unknown;
      updated: unknown;
      ordered: unknown;
      orderNumber: string | null;
      confirmed: unknown;
      fulfilled: unknown;
      contact: { telNumber: string | null; emailAddress: string | null } | null;
      total: {
        isTaxable: boolean;
        isNetPrice: boolean;
        amount: number;
        currencyCode: string;
      } | null;
      user: {
        _id: string;
        username: string | null;
        isGuest: boolean;
        avatar: { _id: string; url: string | null } | null;
        profile: {
          displayName: string | null;
          address: { firstName: string | null; lastName: string | null } | null;
        } | null;
      } | null;
    }>;
  } | null;
};

export type IPaymentProviderFragment = {
  _id: string;
  created: unknown;
  updated: unknown;
  deleted: unknown;
  isActive: boolean | null;
  type: Types.IPaymentProviderType | null;
  configuration: unknown;
  configurationError: Types.IPaymentProviderError | null;
  interface: {
    _id: string;
    label: string | null;
    version: string | null;
  } | null;
};

export type IPaymentProviderFragmentVariables = Exact<{ [key: string]: never }>;

export type ICreatePaymentProviderMutationVariables = Exact<{
  paymentProvider: Types.ICreatePaymentProviderInput;
}>;

export type ICreatePaymentProviderMutation = {
  createPaymentProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IPaymentProviderType | null;
    configuration: unknown;
    configurationError: Types.IPaymentProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  };
};

export type IPaymentInterfacesQueryVariables = Exact<{
  providerType?: Types.IPaymentProviderType | null | undefined;
}>;

export type IPaymentInterfacesQuery = {
  paymentInterfaces: Array<{
    _id: string;
    label: string | null;
    value: string;
  }>;
};

export type IPaymentProviderQueryVariables = Exact<{
  paymentProviderId: string | number;
}>;

export type IPaymentProviderQuery = {
  paymentProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IPaymentProviderType | null;
    configuration: unknown;
    configurationError: Types.IPaymentProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  } | null;
};

export type IPaymentProvidersTypeQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IPaymentProvidersTypeQuery = {
  paymentProviderType: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type IPaymentProvidersQueryVariables = Exact<{
  type?: Types.IPaymentProviderType | null | undefined;
}>;

export type IPaymentProvidersQuery = {
  paymentProvidersCount: number;
  paymentProviders: Array<{
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IPaymentProviderType | null;
    configuration: unknown;
    configurationError: Types.IPaymentProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  }>;
};

export type IRemovePaymentProviderMutationVariables = Exact<{
  paymentProviderId: string | number;
}>;

export type IRemovePaymentProviderMutation = {
  removePaymentProvider: { _id: string };
};

export type IUpdatePaymentProviderMutationVariables = Exact<{
  paymentProvider: Types.IUpdateProviderInput;
  paymentProviderId: string | number;
}>;

export type IUpdatePaymentProviderMutation = {
  updatePaymentProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IPaymentProviderType | null;
    configuration: unknown;
    configurationError: Types.IPaymentProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  };
};

export type IProductReviewDetailFragment = {
  _id: string;
  created: unknown;
  updated: unknown;
  deleted: unknown;
  rating: number | null;
  title: string | null;
  review: string | null;
  upVote: number | null;
  downVote: number | null;
  voteReport: number | null;
  author: {
    _id: string;
    username: string | null;
    name: string;
    isGuest: boolean;
    profile: {
      displayName: string | null;
      address: { firstName: string | null; lastName: string | null } | null;
    } | null;
    avatar: { _id: string; url: string | null } | null;
  };
  product:
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      };
  ownVotes: Array<{ timestamp: unknown; type: Types.IProductReviewVoteType }>;
};

export type IProductReviewDetailFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IAddProductReviewVoteMutationVariables = Exact<{
  productReviewId: string | number;
  type: Types.IProductReviewVoteType;
  meta?: unknown;
  forceLocale?: unknown;
}>;

export type IAddProductReviewVoteMutation = {
  addProductReviewVote: { _id: string };
};

export type ICreateProductReviewMutationVariables = Exact<{
  productId: string | number;
  productReview: Types.IProductReviewInput;
  forceLocale?: unknown;
}>;

export type ICreateProductReviewMutation = {
  createProductReview: { _id: string };
};

export type IProductReviewByProductQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  forceLocale?: unknown;
}>;

export type IProductReviewByProductQuery = {
  product:
    | {
        _id: string;
        reviewsCount: number;
        reviews: Array<{
          _id: string;
          created: unknown;
          updated: unknown;
          deleted: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          upVote: number | null;
          downVote: number | null;
          voteReport: number | null;
          author: {
            _id: string;
            username: string | null;
            name: string;
            isGuest: boolean;
            profile: {
              displayName: string | null;
              address: {
                firstName: string | null;
                lastName: string | null;
              } | null;
            } | null;
            avatar: { _id: string; url: string | null } | null;
          };
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
          ownVotes: Array<{
            timestamp: unknown;
            type: Types.IProductReviewVoteType;
          }>;
        }>;
      }
    | {
        _id: string;
        reviewsCount: number;
        reviews: Array<{
          _id: string;
          created: unknown;
          updated: unknown;
          deleted: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          upVote: number | null;
          downVote: number | null;
          voteReport: number | null;
          author: {
            _id: string;
            username: string | null;
            name: string;
            isGuest: boolean;
            profile: {
              displayName: string | null;
              address: {
                firstName: string | null;
                lastName: string | null;
              } | null;
            } | null;
            avatar: { _id: string; url: string | null } | null;
          };
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
          ownVotes: Array<{
            timestamp: unknown;
            type: Types.IProductReviewVoteType;
          }>;
        }>;
      }
    | {
        _id: string;
        reviewsCount: number;
        reviews: Array<{
          _id: string;
          created: unknown;
          updated: unknown;
          deleted: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          upVote: number | null;
          downVote: number | null;
          voteReport: number | null;
          author: {
            _id: string;
            username: string | null;
            name: string;
            isGuest: boolean;
            profile: {
              displayName: string | null;
              address: {
                firstName: string | null;
                lastName: string | null;
              } | null;
            } | null;
            avatar: { _id: string; url: string | null } | null;
          };
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
          ownVotes: Array<{
            timestamp: unknown;
            type: Types.IProductReviewVoteType;
          }>;
        }>;
      }
    | {
        _id: string;
        reviewsCount: number;
        reviews: Array<{
          _id: string;
          created: unknown;
          updated: unknown;
          deleted: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          upVote: number | null;
          downVote: number | null;
          voteReport: number | null;
          author: {
            _id: string;
            username: string | null;
            name: string;
            isGuest: boolean;
            profile: {
              displayName: string | null;
              address: {
                firstName: string | null;
                lastName: string | null;
              } | null;
            } | null;
            avatar: { _id: string; url: string | null } | null;
          };
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
          ownVotes: Array<{
            timestamp: unknown;
            type: Types.IProductReviewVoteType;
          }>;
        }>;
      }
    | {
        _id: string;
        reviewsCount: number;
        reviews: Array<{
          _id: string;
          created: unknown;
          updated: unknown;
          deleted: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          upVote: number | null;
          downVote: number | null;
          voteReport: number | null;
          author: {
            _id: string;
            username: string | null;
            name: string;
            isGuest: boolean;
            profile: {
              displayName: string | null;
              address: {
                firstName: string | null;
                lastName: string | null;
              } | null;
            } | null;
            avatar: { _id: string; url: string | null } | null;
          };
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  subtitle: string | null;
                } | null;
                media: Array<{
                  _id: string;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
          ownVotes: Array<{
            timestamp: unknown;
            type: Types.IProductReviewVoteType;
          }>;
        }>;
      }
    | null;
};

export type IRemoveProductReviewMutationVariables = Exact<{
  productReviewId: string | number;
}>;

export type IRemoveProductReviewMutation = {
  removeProductReview: { _id: string };
};

export type IRemoveProductReviewVoteMutationVariables = Exact<{
  productReviewId: string | number;
  type: Types.IProductReviewVoteType;
  forceLocale?: unknown;
}>;

export type IRemoveProductReviewVoteMutation = {
  removeProductReviewVote: { _id: string };
};

export type IUserProductReviewsQueryVariables = Exact<{
  userId: string | number;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  forceLocale?: unknown;
}>;

export type IUserProductReviewsQuery = {
  user: {
    _id: string;
    reviewsCount: number;
    reviews: Array<{
      _id: string;
      created: unknown;
      updated: unknown;
      deleted: unknown;
      rating: number | null;
      title: string | null;
      review: string | null;
      upVote: number | null;
      downVote: number | null;
      voteReport: number | null;
      product:
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              title: string | null;
              subtitle: string | null;
              slug: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              title: string | null;
              subtitle: string | null;
              slug: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              title: string | null;
              subtitle: string | null;
              slug: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
            catalogPrice: { amount: number; currencyCode: string } | null;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              title: string | null;
              subtitle: string | null;
              slug: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
            catalogPrice: { amount: number; currencyCode: string } | null;
            proxies: Array<
              | { __typename: 'BundleProduct' }
              | { __typename: 'ConfigurableProduct' }
            >;
          }
        | {
            _id: string;
            sequence: number;
            status: Types.IProductStatus;
            tags: Array<unknown> | null;
            updated: unknown;
            published: unknown;
            texts: {
              _id: string;
              title: string | null;
              subtitle: string | null;
              slug: string | null;
              description: string | null;
              vendor: string | null;
              brand: string | null;
              labels: Array<string> | null;
              locale: unknown;
            } | null;
            media: Array<{
              _id: string;
              tags: Array<unknown> | null;
              file: { _id: string; url: string | null } | null;
            }>;
          };
      author: {
        _id: string;
        username: string | null;
        name: string;
        isGuest: boolean;
        profile: {
          displayName: string | null;
          address: { firstName: string | null; lastName: string | null } | null;
        } | null;
        avatar: { _id: string; url: string | null } | null;
      };
      ownVotes: Array<{
        timestamp: unknown;
        type: Types.IProductReviewVoteType;
      }>;
    }>;
  } | null;
};

export type IProductAssignmentFragment = {
  _id: string;
  vectors: Array<{
    _id: string;
    option: {
      _id: string;
      value: string | null;
      texts: {
        _id: string;
        title: string | null;
        subtitle: string | null;
      } | null;
    } | null;
    variation: {
      _id: string;
      key: string | null;
      texts: { _id: string; locale: unknown; title: string | null } | null;
    } | null;
  }> | null;
  product:
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          slug: string | null;
          subtitle: string | null;
        } | null;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          slug: string | null;
          subtitle: string | null;
        } | null;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          slug: string | null;
          subtitle: string | null;
        } | null;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          slug: string | null;
          subtitle: string | null;
        } | null;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          title: string | null;
          slug: string | null;
          subtitle: string | null;
        } | null;
      }
    | null;
};

export type IProductAssignmentFragmentVariables = Exact<{
  [key: string]: never;
}>;

type IProductBriefFragment_BundleProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  proxies: Array<
    { __typename: 'BundleProduct' } | { __typename: 'ConfigurableProduct' }
  >;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
    locale: unknown;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

type IProductBriefFragment_ConfigurableProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
    locale: unknown;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

type IProductBriefFragment_PlanProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  catalogPrice: { amount: number; currencyCode: string } | null;
  proxies: Array<
    { __typename: 'BundleProduct' } | { __typename: 'ConfigurableProduct' }
  >;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
    locale: unknown;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

type IProductBriefFragment_SimpleProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  catalogPrice: { amount: number; currencyCode: string } | null;
  proxies: Array<
    { __typename: 'BundleProduct' } | { __typename: 'ConfigurableProduct' }
  >;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
    locale: unknown;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

type IProductBriefFragment_TokenizedProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  texts: {
    _id: string;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
    locale: unknown;
  } | null;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
};

export type IProductBriefFragment =
  | IProductBriefFragment_BundleProduct
  | IProductBriefFragment_ConfigurableProduct
  | IProductBriefFragment_PlanProduct
  | IProductBriefFragment_SimpleProduct
  | IProductBriefFragment_TokenizedProduct;

export type IProductBriefFragmentVariables = Exact<{ [key: string]: never }>;

export type IProductCatalogPriceFragment = {
  isTaxable: boolean;
  isNetPrice: boolean;
  amount: number;
  minQuantity: number | null;
  country: {
    _id: string;
    isoCode: string | null;
    name: string | null;
    flagEmoji: string | null;
  };
  currency: { _id: string; isoCode: string; isActive: boolean | null };
};

export type IProductCatalogPriceFragmentVariables = Exact<{
  [key: string]: never;
}>;

type IProductDetailFragment_BundleProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  created: unknown;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
  reviews: Array<{
    _id: string;
    created: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    voteCount: number | null;
    author: { _id: string; username: string | null; isGuest: boolean };
    ownVotes: Array<{ type: Types.IProductReviewVoteType; timestamp: unknown }>;
  }>;
  siblings: Array<
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

type IProductDetailFragment_ConfigurableProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  created: unknown;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
  reviews: Array<{
    _id: string;
    created: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    voteCount: number | null;
    author: { _id: string; username: string | null; isGuest: boolean };
    ownVotes: Array<{ type: Types.IProductReviewVoteType; timestamp: unknown }>;
  }>;
  siblings: Array<
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

type IProductDetailFragment_PlanProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  created: unknown;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
  reviews: Array<{
    _id: string;
    created: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    voteCount: number | null;
    author: { _id: string; username: string | null; isGuest: boolean };
    ownVotes: Array<{ type: Types.IProductReviewVoteType; timestamp: unknown }>;
  }>;
  siblings: Array<
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

type IProductDetailFragment_SimpleProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  created: unknown;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
  reviews: Array<{
    _id: string;
    created: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    voteCount: number | null;
    author: { _id: string; username: string | null; isGuest: boolean };
    ownVotes: Array<{ type: Types.IProductReviewVoteType; timestamp: unknown }>;
  }>;
  siblings: Array<
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

type IProductDetailFragment_TokenizedProduct = {
  _id: string;
  sequence: number;
  status: Types.IProductStatus;
  created: unknown;
  tags: Array<unknown> | null;
  updated: unknown;
  published: unknown;
  media: Array<{
    _id: string;
    tags: Array<unknown> | null;
    file: { _id: string; url: string | null } | null;
  }>;
  reviews: Array<{
    _id: string;
    created: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    voteCount: number | null;
    author: { _id: string; username: string | null; isGuest: boolean };
    ownVotes: Array<{ type: Types.IProductReviewVoteType; timestamp: unknown }>;
  }>;
  siblings: Array<
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

export type IProductDetailFragment =
  | IProductDetailFragment_BundleProduct
  | IProductDetailFragment_ConfigurableProduct
  | IProductDetailFragment_PlanProduct
  | IProductDetailFragment_SimpleProduct
  | IProductDetailFragment_TokenizedProduct;

export type IProductDetailFragmentVariables = Exact<{ [key: string]: never }>;

export type IProductDimensionFragment = {
  weight: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
};

export type IProductDimensionFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IProductMediaFragment = {
  _id: string;
  tags: Array<unknown> | null;
  sortKey: number;
  file: {
    _id: string;
    name: string;
    type: string;
    size: number;
    url: string | null;
  } | null;
  texts: {
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  } | null;
};

export type IProductMediaFragmentVariables = Exact<{ [key: string]: never }>;

export type IProductMediaTextsFragment = {
  _id: string;
  locale: unknown;
  title: string | null;
  subtitle: string | null;
};

export type IProductMediaTextsFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IProductPlanConfigurationFragment = {
  usageCalculationType: Types.IProductPlanUsageCalculationType;
  billingInterval: Types.IProductPlanConfigurationInterval;
  trialInterval: Types.IProductPlanConfigurationInterval | null;
  trialIntervalCount: number | null;
  billingIntervalCount: number | null;
};

export type IProductPlanConfigurationFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IProductTextsFragment = {
  _id: string;
  locale: unknown;
  slug: string | null;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  vendor: string | null;
  brand: string | null;
  labels: Array<string> | null;
};

export type IProductTextsFragmentVariables = Exact<{ [key: string]: never }>;

export type IProductVariationFragment = {
  _id: string;
  type: Types.IProductVariationType | null;
  key: string | null;
  texts: {
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  } | null;
  options: Array<{
    _id: string;
    value: string | null;
    texts: {
      _id: string;
      locale: unknown;
      title: string | null;
      subtitle: string | null;
    } | null;
  }> | null;
};

export type IProductVariationFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type ITokenFragment = {
  _id: string;
  walletAddress: string | null;
  status: Types.ITokenExportStatus;
  quantity: number;
  contractAddress: string | null;
  chainId: string | null;
  tokenSerialNumber: string | null;
  invalidatedDate: unknown;
  expiryDate: unknown;
  ercMetadata: unknown;
  accessKey: string;
  isInvalidateable: boolean;
};

export type ITokenFragmentVariables = Exact<{ [key: string]: never }>;

export type IAddProductAssignmentMutationVariables = Exact<{
  proxyId: string | number;
  productId: string | number;
  vectors: Array<Types.IProductAssignmentVectorInput>;
}>;

export type IAddProductAssignmentMutation = {
  addProductAssignment:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string };
};

export type IPrepareProductMediaUploadMutationVariables = Exact<{
  mediaName: string;
  productId: string | number;
}>;

export type IPrepareProductMediaUploadMutation = {
  prepareProductMediaUpload: { _id: string; putURL: string; expires: unknown };
};

export type IBulkSetProductStatusMutationVariables = Exact<{
  productIds: Array<string | number>;
  status: Types.IProductStatus;
}>;

export type IBulkSetProductStatusMutation = {
  bulkSetProductStatus: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkUpdateProductTagsMutationVariables = Exact<{
  productIds: Array<string | number>;
  add?: Array<unknown> | null | undefined;
  remove?: Array<unknown> | null | undefined;
}>;

export type IBulkUpdateProductTagsMutation = {
  bulkUpdateProductTags: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkRemoveProductsMutationVariables = Exact<{
  productIds: Array<string | number>;
}>;

export type IBulkRemoveProductsMutation = {
  bulkRemoveProducts: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type IBulkAssignProductsToAssortmentMutationVariables = Exact<{
  productIds: Array<string | number>;
  assortmentId: string | number;
}>;

export type IBulkAssignProductsToAssortmentMutation = {
  bulkAssignProductsToAssortment: {
    successCount: number;
    failedCount: number;
    failedIds: Array<string>;
  };
};

export type ICreateProductMutationVariables = Exact<{
  product: Types.ICreateProductInput;
  texts?: Array<Types.IProductTextInput> | null | undefined;
}>;

export type ICreateProductMutation = {
  createProduct:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          locale: unknown;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          locale: unknown;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          locale: unknown;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          locale: unknown;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          locale: unknown;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      };
};

export type ICreateProductBundleItemMutationVariables = Exact<{
  productId: string | number;
  item: Types.ICreateProductBundleItemInput;
}>;

export type ICreateProductBundleItemMutation = {
  createProductBundleItem:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string };
};

export type ICreateProductVariationMutationVariables = Exact<{
  productId: string | number;
  variation: Types.ICreateProductVariationInput;
  texts?: Array<Types.IProductVariationTextInput> | null | undefined;
}>;

export type ICreateProductVariationMutation = {
  createProductVariation: { _id: string };
};

export type ICreateProductVariationOptionMutationVariables = Exact<{
  productVariationId: string | number;
  option: string;
  texts?: Array<Types.IProductVariationTextInput> | null | undefined;
}>;

export type ICreateProductVariationOptionMutation = {
  createProductVariationOption: { _id: string };
};

export type IExportTokenMutationVariables = Exact<{
  tokenId: string | number;
  quantity?: number;
  recipientWalletAddress: string;
}>;

export type IExportTokenMutation = {
  exportToken: {
    _id: string;
    walletAddress: string | null;
    status: Types.ITokenExportStatus;
    quantity: number;
    contractAddress: string | null;
    chainId: string | null;
    tokenSerialNumber: string | null;
    invalidatedDate: unknown;
    expiryDate: unknown;
    ercMetadata: unknown;
    accessKey: string;
    isInvalidateable: boolean;
  };
};

export type IProductQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductQuery = {
  product:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | null;
};

export type IProductAssignmentsQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductAssignmentsQuery = {
  product:
    | { _id: string }
    | {
        _id: string;
        texts: {
          _id: string;
          subtitle: string | null;
          slug: string | null;
          title: string | null;
        } | null;
        variations: Array<{
          _id: string;
          key: string | null;
          texts: { _id: string; title: string | null } | null;
          options: Array<{
            _id: string;
            value: string | null;
            texts: { _id: string; title: string | null } | null;
          }> | null;
        }> | null;
        assignments: Array<{
          _id: string;
          vectors: Array<{
            _id: string;
            option: {
              _id: string;
              value: string | null;
              texts: {
                _id: string;
                title: string | null;
                subtitle: string | null;
              } | null;
            } | null;
            variation: {
              _id: string;
              key: string | null;
              texts: {
                _id: string;
                locale: unknown;
                title: string | null;
              } | null;
            } | null;
          }> | null;
          product:
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  slug: string | null;
                  subtitle: string | null;
                } | null;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  slug: string | null;
                  subtitle: string | null;
                } | null;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  slug: string | null;
                  subtitle: string | null;
                } | null;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  slug: string | null;
                  subtitle: string | null;
                } | null;
              }
            | {
                _id: string;
                texts: {
                  _id: string;
                  title: string | null;
                  slug: string | null;
                  subtitle: string | null;
                } | null;
              }
            | null;
        }>;
      }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | null;
};

export type IProductBundleItemsQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
  forceLocale?: unknown;
}>;

export type IProductBundleItemsQuery = {
  product:
    | {
        _id: string;
        bundleItems: Array<{
          quantity: number;
          product:
            | {
                _id: string;
                sequence: number;
                status: Types.IProductStatus;
                tags: Array<unknown> | null;
                updated: unknown;
                published: unknown;
                proxies: Array<
                  | { __typename: 'BundleProduct' }
                  | { __typename: 'ConfigurableProduct' }
                >;
                texts: {
                  _id: string;
                  slug: string | null;
                  title: string | null;
                  subtitle: string | null;
                  description: string | null;
                  vendor: string | null;
                  brand: string | null;
                  labels: Array<string> | null;
                  locale: unknown;
                } | null;
                media: Array<{
                  _id: string;
                  tags: Array<unknown> | null;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                sequence: number;
                status: Types.IProductStatus;
                tags: Array<unknown> | null;
                updated: unknown;
                published: unknown;
                texts: {
                  _id: string;
                  slug: string | null;
                  title: string | null;
                  subtitle: string | null;
                  description: string | null;
                  vendor: string | null;
                  brand: string | null;
                  labels: Array<string> | null;
                  locale: unknown;
                } | null;
                media: Array<{
                  _id: string;
                  tags: Array<unknown> | null;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                sequence: number;
                status: Types.IProductStatus;
                tags: Array<unknown> | null;
                updated: unknown;
                published: unknown;
                catalogPrice: { amount: number; currencyCode: string } | null;
                proxies: Array<
                  | { __typename: 'BundleProduct' }
                  | { __typename: 'ConfigurableProduct' }
                >;
                texts: {
                  _id: string;
                  slug: string | null;
                  title: string | null;
                  subtitle: string | null;
                  description: string | null;
                  vendor: string | null;
                  brand: string | null;
                  labels: Array<string> | null;
                  locale: unknown;
                } | null;
                media: Array<{
                  _id: string;
                  tags: Array<unknown> | null;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                sequence: number;
                status: Types.IProductStatus;
                tags: Array<unknown> | null;
                updated: unknown;
                published: unknown;
                catalogPrice: { amount: number; currencyCode: string } | null;
                proxies: Array<
                  | { __typename: 'BundleProduct' }
                  | { __typename: 'ConfigurableProduct' }
                >;
                texts: {
                  _id: string;
                  slug: string | null;
                  title: string | null;
                  subtitle: string | null;
                  description: string | null;
                  vendor: string | null;
                  brand: string | null;
                  labels: Array<string> | null;
                  locale: unknown;
                } | null;
                media: Array<{
                  _id: string;
                  tags: Array<unknown> | null;
                  file: { _id: string; url: string | null } | null;
                }>;
              }
            | {
                _id: string;
                sequence: number;
                status: Types.IProductStatus;
                tags: Array<unknown> | null;
                updated: unknown;
                published: unknown;
                texts: {
                  _id: string;
                  slug: string | null;
                  title: string | null;
                  subtitle: string | null;
                  description: string | null;
                  vendor: string | null;
                  brand: string | null;
                  labels: Array<string> | null;
                  locale: unknown;
                } | null;
                media: Array<{
                  _id: string;
                  tags: Array<unknown> | null;
                  file: { _id: string; url: string | null } | null;
                }>;
              };
        }> | null;
      }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | null;
};

export type IProductCatalogPricesQueryVariables = Exact<{
  productId: string | number;
}>;

export type IProductCatalogPricesQuery = {
  productCatalogPrices: Array<{
    isTaxable: boolean;
    isNetPrice: boolean;
    amount: number;
    minQuantity: number | null;
    country: {
      _id: string;
      isoCode: string | null;
      name: string | null;
      flagEmoji: string | null;
    };
    currency: { _id: string; isoCode: string; isActive: boolean | null };
  }>;
};

export type IProductFulfillmentSimulationQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  deliveryProviderType?: Types.IDeliveryProviderType | null | undefined;
  quantity?: number | null | undefined;
  referenceDate?: unknown;
}>;

export type IProductFulfillmentSimulationQuery = {
  product:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | {
        _id: string;
        simulatedDispatches: Array<{
          shipping: unknown;
          earliestDelivery: unknown;
          deliveryProvider:
            | {
                _id: string;
                type: Types.IDeliveryProviderType | null;
                isActive: boolean | null;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | {
                _id: string;
                type: Types.IDeliveryProviderType | null;
                isActive: boolean | null;
                interface: {
                  _id: string;
                  label: string | null;
                  version: string | null;
                } | null;
              }
            | null;
          warehousingProvider: {
            _id: string;
            type: Types.IWarehousingProviderType | null;
            isActive: boolean | null;
            interface: {
              _id: string;
              label: string | null;
              version: string | null;
            } | null;
          } | null;
        }> | null;
        simulatedStocks: Array<{
          quantity: number | null;
          deliveryProvider:
            | {
                _id: string;
                type: Types.IDeliveryProviderType | null;
                interface: { _id: string; label: string | null } | null;
              }
            | {
                _id: string;
                type: Types.IDeliveryProviderType | null;
                interface: { _id: string; label: string | null } | null;
              }
            | null;
          warehousingProvider: {
            _id: string;
            interface: { _id: string; label: string | null } | null;
          } | null;
        }> | null;
      }
    | { _id: string }
    | null;
};

export type IProductMediaQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductMediaQuery = {
  product:
    | {
        _id: string;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          sortKey: number;
          file: {
            _id: string;
            name: string;
            type: string;
            size: number;
            url: string | null;
          } | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          sortKey: number;
          file: {
            _id: string;
            name: string;
            type: string;
            size: number;
            url: string | null;
          } | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          sortKey: number;
          file: {
            _id: string;
            name: string;
            type: string;
            size: number;
            url: string | null;
          } | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          sortKey: number;
          file: {
            _id: string;
            name: string;
            type: string;
            size: number;
            url: string | null;
          } | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
        }>;
      }
    | {
        _id: string;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          sortKey: number;
          file: {
            _id: string;
            name: string;
            type: string;
            size: number;
            url: string | null;
          } | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
        }>;
      }
    | null;
};

export type IProductPlanQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductPlanQuery = {
  product:
    | { _id: string }
    | { _id: string }
    | {
        _id: string;
        plan: {
          usageCalculationType: Types.IProductPlanUsageCalculationType;
          billingInterval: Types.IProductPlanConfigurationInterval;
          trialInterval: Types.IProductPlanConfigurationInterval | null;
          trialIntervalCount: number | null;
          billingIntervalCount: number | null;
        } | null;
      }
    | { _id: string }
    | { _id: string }
    | null;
};

export type IProductPlanConfigurationOptionsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IProductPlanConfigurationOptionsQuery = {
  usageCalculationTypes: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
  configurationIntervals: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type IProductReviewsQueryVariables = Exact<{
  queryString?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  forceLocale?: unknown;
}>;

export type IProductReviewsQuery = {
  productReviews: Array<{
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    rating: number | null;
    title: string | null;
    review: string | null;
    upVote: number | null;
    downVote: number | null;
    voteReport: number | null;
    author: {
      _id: string;
      username: string | null;
      name: string;
      isGuest: boolean;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
      avatar: { _id: string; url: string | null } | null;
    };
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            subtitle: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; url: string | null } | null;
          }>;
        };
    ownVotes: Array<{ timestamp: unknown; type: Types.IProductReviewVoteType }>;
  }>;
};

export type IProductSupplyQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductSupplyQuery = {
  product:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | {
        _id: string;
        dimensions: {
          weight: number | null;
          length: number | null;
          width: number | null;
          height: number | null;
        } | null;
      }
    | { _id: string }
    | null;
};

export type IProductTokenizationQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductTokenizationQuery = {
  product:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | {
        contractStandard: Types.ISmartContractStandard | null;
        contractAddress: string | null;
        _id: string;
        contractConfiguration: { tokenId: string; supply: number } | null;
      }
    | null;
};

export type IProductVariationTypeQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IProductVariationTypeQuery = {
  variationTypes: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type IProductVariationsQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
  locale?: unknown;
}>;

export type IProductVariationsQuery = {
  product:
    | { _id: string }
    | {
        _id: string;
        variations: Array<{
          _id: string;
          type: Types.IProductVariationType | null;
          key: string | null;
          texts: {
            _id: string;
            locale: unknown;
            title: string | null;
            subtitle: string | null;
          } | null;
          options: Array<{
            _id: string;
            value: string | null;
            texts: {
              _id: string;
              locale: unknown;
              title: string | null;
              subtitle: string | null;
            } | null;
          }> | null;
        }> | null;
      }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | null;
};

export type IProductWarehousingQueryVariables = Exact<{
  productId?: string | number | null | undefined;
  slug?: string | null | undefined;
}>;

export type IProductWarehousingQuery = {
  product:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { sku: string | null; baseUnit: string | null; _id: string }
    | { _id: string }
    | null;
};

export type IProductsQueryVariables = Exact<{
  queryString?: string | null | undefined;
  tags?: Array<unknown> | null | undefined;
  slugs?: Array<string> | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  includeDrafts?: boolean | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
  forceLocale?: unknown;
}>;

export type IProductsQuery = {
  productsCount: number;
  products: Array<
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        catalogPrice: { amount: number; currencyCode: string } | null;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        sku: string | null;
        baseUnit: string | null;
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        dimensions: {
          weight: number | null;
          length: number | null;
          width: number | null;
          height: number | null;
        } | null;
        catalogPrice: { amount: number; currencyCode: string } | null;
        proxies: Array<
          | { __typename: 'BundleProduct' }
          | { __typename: 'ConfigurableProduct' }
        >;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      }
  >;
};

export type IProductsCountQueryVariables = Exact<{
  queryString?: string | null | undefined;
  tags?: Array<unknown> | null | undefined;
  slugs?: Array<string> | null | undefined;
  includeDrafts?: boolean | null | undefined;
}>;

export type IProductsCountQuery = { productsCount: number };

export type IPublishProductMutationVariables = Exact<{
  productId: string | number;
}>;

export type IPublishProductMutation = {
  publishProduct:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      };
};

export type IReOrderProductMediaMutationVariables = Exact<{
  sortKeys: Array<Types.IReorderProductMediaInput>;
}>;

export type IReOrderProductMediaMutation = {
  reorderProductMedia: Array<{ _id: string }>;
};

export type IRemoveBundleItemMutationVariables = Exact<{
  productId: string | number;
  index: number;
}>;

export type IRemoveBundleItemMutation = {
  removeBundleItem:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string };
};

export type IRemoveProductMutationVariables = Exact<{
  productId: string | number;
}>;

export type IRemoveProductMutation = {
  removeProduct:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string };
};

export type IRemoveProductAssignmentMutationVariables = Exact<{
  proxyId: string | number;
  vectors: Array<Types.IProductAssignmentVectorInput>;
}>;

export type IRemoveProductAssignmentMutation = {
  removeProductAssignment:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string };
};

export type IRemoveProductMediaMutationVariables = Exact<{
  productMediaId: string | number;
}>;

export type IRemoveProductMediaMutation = {
  removeProductMedia: { _id: string };
};

export type IRemoveProductVariationMutationVariables = Exact<{
  productVariationId: string | number;
}>;

export type IRemoveProductVariationMutation = {
  removeProductVariation: { _id: string };
};

export type IRemoveProductVariationOptionMutationVariables = Exact<{
  productVariationId: string | number;
  productVariationOptionValue: string;
}>;

export type IRemoveProductVariationOptionMutation = {
  removeProductVariationOption: { _id: string };
};

export type ISmartContractStandardsQueryVariables = Exact<{
  [key: string]: never;
}>;

export type ISmartContractStandardsQuery = {
  smartContractStandards: {
    options: Array<{ value: string; label: string }> | null;
  } | null;
};

export type ITranslatedProductMediaTextsQueryVariables = Exact<{
  productMediaId: string | number;
}>;

export type ITranslatedProductMediaTextsQuery = {
  translatedProductMediaTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type ITranslatedProductTextsQueryVariables = Exact<{
  productId: string | number;
}>;

export type ITranslatedProductTextsQuery = {
  translatedProductTexts: Array<{
    _id: string;
    locale: unknown;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
  }>;
};

export type IUnpublishProductMutationVariables = Exact<{
  productId: string | number;
}>;

export type IUnpublishProductMutation = {
  unpublishProduct:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      };
};

export type IUpdateProductMutationVariables = Exact<{
  productId: string | number;
  product: Types.IUpdateProductInput;
}>;

export type IUpdateProductMutation = {
  updateProduct:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | null;
};

export type IUpdateProductCommerceMutationVariables = Exact<{
  productId: string | number;
  commerce: Types.IUpdateProductCommerceInput;
}>;

export type IUpdateProductCommerceMutation = {
  updateProductCommerce:
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        created: unknown;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
        reviews: Array<{
          _id: string;
          created: unknown;
          rating: number | null;
          title: string | null;
          review: string | null;
          voteCount: number | null;
          author: { _id: string; username: string | null; isGuest: boolean };
          ownVotes: Array<{
            type: Types.IProductReviewVoteType;
            timestamp: unknown;
          }>;
        }>;
        siblings: Array<
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
          | {
              _id: string;
              media: Array<{
                _id: string;
                file: { _id: string; url: string | null } | null;
              }>;
            }
        >;
      }
    | null;
};

export type IUpdateProductMediaTextsMutationVariables = Exact<{
  productMediaId: string | number;
  texts: Array<Types.IProductMediaTextInput>;
}>;

export type IUpdateProductMediaTextsMutation = {
  updateProductMediaTexts: Array<{
    _id: string;
    locale: unknown;
    title: string | null;
    subtitle: string | null;
  }>;
};

export type IUpdateProductPlanMutationVariables = Exact<{
  productId: string | number;
  plan: Types.IUpdateProductPlanInput;
}>;

export type IUpdateProductPlanMutation = {
  updateProductPlan:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | null;
};

export type IUpdateProductSupplyMutationVariables = Exact<{
  productId: string | number;
  supply: Types.IUpdateProductSupplyInput;
}>;

export type IUpdateProductSupplyMutation = {
  updateProductSupply:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | {
        _id: string;
        dimensions: {
          weight: number | null;
          length: number | null;
          width: number | null;
          height: number | null;
        } | null;
      }
    | { _id: string }
    | null;
};

export type IUpdateProductTextsMutationVariables = Exact<{
  productId: string | number;
  texts: Array<Types.IProductTextInput>;
}>;

export type IUpdateProductTextsMutation = {
  updateProductTexts: Array<{
    _id: string;
    locale: unknown;
    slug: string | null;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    vendor: string | null;
    brand: string | null;
    labels: Array<string> | null;
  }>;
};

export type IUpdateProductTokenizationMutationVariables = Exact<{
  productId: string | number;
  tokenization: Types.IUpdateProductTokenizationInput;
}>;

export type IUpdateProductTokenizationMutation = {
  updateProductTokenization: { _id: string } | null;
};

export type IUpdateProductVariationTextsMutationVariables = Exact<{
  productVariationId: string | number;
  productVariationOptionValue?: string | null | undefined;
  texts: Array<Types.IProductVariationTextInput>;
}>;

export type IUpdateProductVariationTextsMutation = {
  updateProductVariationTexts: Array<{ _id: string }>;
};

export type IUpdateProductWarehousingMutationVariables = Exact<{
  productId: string | number;
  warehousing: Types.IUpdateProductWarehousingInput;
}>;

export type IUpdateProductWarehousingMutation = {
  updateProductWarehousing:
    | { _id: string }
    | { _id: string }
    | { _id: string }
    | { sku: string | null; baseUnit: string | null; _id: string }
    | { _id: string }
    | null;
};

export type IUserTokensQueryVariables = Exact<{
  userId: string | number;
  forceLocale?: unknown;
}>;

export type IUserTokensQuery = {
  user: {
    _id: string;
    web3Addresses: Array<{
      address: string;
      nonce: string | null;
      verified: boolean;
    }>;
    tokens: Array<{
      _id: string;
      walletAddress: string | null;
      status: Types.ITokenExportStatus;
      quantity: number;
      contractAddress: string | null;
      chainId: string | null;
      tokenSerialNumber: string | null;
      invalidatedDate: unknown;
      expiryDate: unknown;
      ercMetadata: unknown;
      accessKey: string;
      isInvalidateable: boolean;
      product: {
        _id: string;
        sequence: number;
        status: Types.IProductStatus;
        tags: Array<unknown> | null;
        updated: unknown;
        published: unknown;
        simulatedPrice: { amount: number; currencyCode: string } | null;
        texts: {
          _id: string;
          slug: string | null;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          vendor: string | null;
          brand: string | null;
          labels: Array<string> | null;
          locale: unknown;
        } | null;
        media: Array<{
          _id: string;
          tags: Array<unknown> | null;
          file: { _id: string; url: string | null } | null;
        }>;
      };
    }>;
  } | null;
};

export type IQuotationDetailFragment = {
  _id: string;
  status: Types.IQuotationStatus;
  created: unknown;
  expires: unknown;
  updated: unknown;
  isExpired: boolean | null;
  quotationNumber: string | null;
  fulfilled: unknown;
  rejected: unknown;
  user: {
    _id: string;
    username: string | null;
    name: string;
    avatar: { _id: string; url: string | null } | null;
    primaryEmail: { verified: boolean; address: string } | null;
  };
  configuration: Array<{ key: string; value: string }> | null;
  country: {
    _id: string;
    isoCode: string | null;
    flagEmoji: string | null;
    name: string | null;
  } | null;
  currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
  product:
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      };
};

export type IQuotationDetailFragmentVariables = Exact<{ [key: string]: never }>;

export type IQuotationFragment = {
  _id: string;
  status: Types.IQuotationStatus;
  created: unknown;
  expires: unknown;
  updated: unknown;
  isExpired: boolean | null;
  quotationNumber: string | null;
  fulfilled: unknown;
  rejected: unknown;
  user: {
    _id: string;
    username: string | null;
    name: string;
    avatar: { _id: string; url: string | null } | null;
    primaryEmail: { verified: boolean; address: string } | null;
  };
  product:
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      }
    | {
        _id: string;
        texts: {
          _id: string;
          slug: string | null;
          subtitle: string | null;
          title: string | null;
          description: string | null;
        } | null;
        media: Array<{
          _id: string;
          file: { _id: string; type: string; url: string | null } | null;
        }>;
      };
  currency: {
    _id: string;
    contractAddress: string | null;
    decimals: number | null;
    isoCode: string;
  } | null;
};

export type IQuotationFragmentVariables = Exact<{ [key: string]: never }>;

export type IMakeQuotationProposalMutationVariables = Exact<{
  quotationId: string | number;
  quotationContext?: unknown;
}>;

export type IMakeQuotationProposalMutation = {
  makeQuotationProposal: {
    _id: string;
    status: Types.IQuotationStatus;
    created: unknown;
    expires: unknown;
    updated: unknown;
    isExpired: boolean | null;
    quotationNumber: string | null;
    fulfilled: unknown;
    rejected: unknown;
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
    };
    configuration: Array<{ key: string; value: string }> | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        };
  };
};

export type IQuotationQueryVariables = Exact<{
  quotationId: string | number;
}>;

export type IQuotationQuery = {
  quotationsCount: number;
  quotation: {
    _id: string;
    status: Types.IQuotationStatus;
    created: unknown;
    expires: unknown;
    updated: unknown;
    isExpired: boolean | null;
    quotationNumber: string | null;
    fulfilled: unknown;
    rejected: unknown;
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
    };
    configuration: Array<{ key: string; value: string }> | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        };
  } | null;
};

export type IQuotationsQueryVariables = Exact<{
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  queryString?: string | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type IQuotationsQuery = {
  quotationsCount: number;
  quotations: Array<{
    _id: string;
    status: Types.IQuotationStatus;
    created: unknown;
    expires: unknown;
    updated: unknown;
    isExpired: boolean | null;
    quotationNumber: string | null;
    fulfilled: unknown;
    rejected: unknown;
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
    };
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        };
    currency: {
      _id: string;
      contractAddress: string | null;
      decimals: number | null;
      isoCode: string;
    } | null;
  }>;
};

export type IRejectQuotationMutationVariables = Exact<{
  quotationId: string | number;
  quotationContext?: unknown;
}>;

export type IRejectQuotationMutation = {
  rejectQuotation: {
    _id: string;
    status: Types.IQuotationStatus;
    created: unknown;
    expires: unknown;
    updated: unknown;
    isExpired: boolean | null;
    quotationNumber: string | null;
    fulfilled: unknown;
    rejected: unknown;
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
    };
    configuration: Array<{ key: string; value: string }> | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        };
  };
};

export type IUserQuotationsQueryVariables = Exact<{
  userId: string | number;
  queryString?: string | null | undefined;
}>;

export type IUserQuotationsQuery = {
  user: {
    _id: string;
    quotations: Array<{
      _id: string;
      status: Types.IQuotationStatus;
      created: unknown;
      expires: unknown;
      updated: unknown;
      isExpired: boolean | null;
      quotationNumber: string | null;
      fulfilled: unknown;
      rejected: unknown;
      user: {
        _id: string;
        username: string | null;
        name: string;
        avatar: { _id: string; url: string | null } | null;
        primaryEmail: { verified: boolean; address: string } | null;
      };
      product:
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              subtitle: string | null;
              title: string | null;
              description: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; type: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              subtitle: string | null;
              title: string | null;
              description: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; type: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              subtitle: string | null;
              title: string | null;
              description: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; type: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              subtitle: string | null;
              title: string | null;
              description: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; type: string; url: string | null } | null;
            }>;
          }
        | {
            _id: string;
            texts: {
              _id: string;
              slug: string | null;
              subtitle: string | null;
              title: string | null;
              description: string | null;
            } | null;
            media: Array<{
              _id: string;
              file: { _id: string; type: string; url: string | null } | null;
            }>;
          };
      currency: {
        _id: string;
        contractAddress: string | null;
        decimals: number | null;
        isoCode: string;
      } | null;
    }>;
  } | null;
};

export type IVerifyQuotationMutationVariables = Exact<{
  quotationId: string | number;
  quotationContext?: unknown;
}>;

export type IVerifyQuotationMutation = {
  verifyQuotation: {
    _id: string;
    status: Types.IQuotationStatus;
    created: unknown;
    expires: unknown;
    updated: unknown;
    isExpired: boolean | null;
    quotationNumber: string | null;
    fulfilled: unknown;
    rejected: unknown;
    user: {
      _id: string;
      username: string | null;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
    };
    configuration: Array<{ key: string; value: string }> | null;
    country: {
      _id: string;
      isoCode: string | null;
      flagEmoji: string | null;
      name: string | null;
    } | null;
    currency: { _id: string; isoCode: string; isActive: boolean | null } | null;
    product:
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        }
      | {
          _id: string;
          texts: {
            _id: string;
            slug: string | null;
            subtitle: string | null;
            title: string | null;
            description: string | null;
          } | null;
          media: Array<{
            _id: string;
            file: { _id: string; type: string; url: string | null } | null;
          }>;
        };
  };
};

type IGlobalSearchProductFragment_BundleProduct = {
  __typename: 'BundleProduct';
  _id: string;
  texts: { _id: string; title: string | null; slug: string | null } | null;
  media: Array<{ file: { url: string | null } | null }>;
};

type IGlobalSearchProductFragment_ConfigurableProduct = {
  __typename: 'ConfigurableProduct';
  _id: string;
  texts: { _id: string; title: string | null; slug: string | null } | null;
  media: Array<{ file: { url: string | null } | null }>;
};

type IGlobalSearchProductFragment_PlanProduct = {
  __typename: 'PlanProduct';
  _id: string;
  texts: { _id: string; title: string | null; slug: string | null } | null;
  media: Array<{ file: { url: string | null } | null }>;
};

type IGlobalSearchProductFragment_SimpleProduct = {
  __typename: 'SimpleProduct';
  _id: string;
  texts: { _id: string; title: string | null; slug: string | null } | null;
  media: Array<{ file: { url: string | null } | null }>;
};

type IGlobalSearchProductFragment_TokenizedProduct = {
  __typename: 'TokenizedProduct';
  _id: string;
  texts: { _id: string; title: string | null; slug: string | null } | null;
  media: Array<{ file: { url: string | null } | null }>;
};

export type IGlobalSearchProductFragment =
  | IGlobalSearchProductFragment_BundleProduct
  | IGlobalSearchProductFragment_ConfigurableProduct
  | IGlobalSearchProductFragment_PlanProduct
  | IGlobalSearchProductFragment_SimpleProduct
  | IGlobalSearchProductFragment_TokenizedProduct;

export type IGlobalSearchProductFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type IGlobalSearchQueryVariables = Exact<{
  query: string;
  types?: Array<Types.ISearchableEntity> | null | undefined;
  limit?: number | null | undefined;
  includeDraftProducts?: boolean | null | undefined;
  includeInactiveAssortments?: boolean | null | undefined;
  includeInactiveFilters?: boolean | null | undefined;
  includeGuestUsers?: boolean | null | undefined;
  includeCarts?: boolean | null | undefined;
}>;

export type IGlobalSearchQuery = {
  globalSearch: {
    counts: Array<{
      type: Types.ISearchableEntity;
      totalCount: number;
      authorized: boolean;
    }>;
    results: Array<
      | {
          __typename: 'Assortment';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | {
          __typename: 'BundleProduct';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | {
          __typename: 'ConfigurableProduct';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | { __typename: 'Enrollment'; _id: string }
      | { __typename: 'Filter'; _id: string; key: string | null }
      | { __typename: 'Order'; _id: string; orderNumber: string | null }
      | {
          __typename: 'PlanProduct';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | { __typename: 'Quotation'; _id: string }
      | {
          __typename: 'SimpleProduct';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | {
          __typename: 'TokenizedProduct';
          _id: string;
          texts: {
            _id: string;
            title: string | null;
            slug: string | null;
          } | null;
          media: Array<{ file: { url: string | null } | null }>;
        }
      | {
          __typename: 'User';
          _id: string;
          username: string | null;
          name: string;
          emails: Array<{ address: string; verified: boolean }> | null;
          avatar: { url: string | null } | null;
        }
      | { __typename: 'Work'; _id: string; type: Types.IWorkType }
    >;
  };
};

export type IInvalidateTokenMutationVariables = Exact<{
  tokenId: string | number;
}>;

export type IInvalidateTokenMutation = {
  invalidateToken: {
    _id: string;
    walletAddress: string | null;
    status: Types.ITokenExportStatus;
    quantity: number;
    contractAddress: string | null;
    chainId: string | null;
    tokenSerialNumber: string | null;
    invalidatedDate: unknown;
    expiryDate: unknown;
    ercMetadata: unknown;
    accessKey: string;
    isInvalidateable: boolean;
  };
};

export type ITokenQueryVariables = Exact<{
  tokenId: string | number;
  forceLocale?: unknown;
}>;

export type ITokenQuery = {
  token: {
    _id: string;
    walletAddress: string | null;
    status: Types.ITokenExportStatus;
    quantity: number;
    contractAddress: string | null;
    chainId: string | null;
    tokenSerialNumber: string | null;
    invalidatedDate: unknown;
    expiryDate: unknown;
    ercMetadata: unknown;
    accessKey: string;
    isInvalidateable: boolean;
    product: {
      _id: string;
      sequence: number;
      status: Types.IProductStatus;
      tags: Array<unknown> | null;
      updated: unknown;
      published: unknown;
      simulatedPrice: { amount: number; currencyCode: string } | null;
      texts: {
        _id: string;
        slug: string | null;
        title: string | null;
        subtitle: string | null;
        description: string | null;
        vendor: string | null;
        brand: string | null;
        labels: Array<string> | null;
        locale: unknown;
      } | null;
      media: Array<{
        _id: string;
        tags: Array<unknown> | null;
        file: { _id: string; url: string | null } | null;
      }>;
    };
    user: {
      _id: string;
      username: string | null;
      isGuest: boolean;
      name: string;
      avatar: { _id: string; url: string | null } | null;
      primaryEmail: { verified: boolean; address: string } | null;
      lastContact: {
        telNumber: string | null;
        emailAddress: string | null;
      } | null;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
    } | null;
  } | null;
};

export type ITokensQueryVariables = Exact<{
  queryString?: string | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  forceLocale?: unknown;
}>;

export type ITokensQuery = {
  tokensCount: number;
  tokens: Array<{
    _id: string;
    walletAddress: string | null;
    status: Types.ITokenExportStatus;
    quantity: number;
    contractAddress: string | null;
    chainId: string | null;
    tokenSerialNumber: string | null;
    invalidatedDate: unknown;
    expiryDate: unknown;
    ercMetadata: unknown;
    accessKey: string;
    isInvalidateable: boolean;
    product: {
      _id: string;
      sequence: number;
      status: Types.IProductStatus;
      tags: Array<unknown> | null;
      updated: unknown;
      published: unknown;
      simulatedPrice: { amount: number; currencyCode: string } | null;
      texts: {
        _id: string;
        slug: string | null;
        title: string | null;
        subtitle: string | null;
        description: string | null;
        vendor: string | null;
        brand: string | null;
        labels: Array<string> | null;
        locale: unknown;
      } | null;
      media: Array<{
        _id: string;
        tags: Array<unknown> | null;
        file: { _id: string; url: string | null } | null;
      }>;
    };
    user: {
      _id: string;
      username: string | null;
      isGuest: boolean;
      primaryEmail: { address: string; verified: boolean } | null;
      avatar: { _id: string; url: string | null } | null;
      profile: {
        displayName: string | null;
        address: { firstName: string | null; lastName: string | null } | null;
      } | null;
    } | null;
  }>;
};

export type IWarehousingProviderFragment = {
  _id: string;
  created: unknown;
  updated: unknown;
  deleted: unknown;
  isActive: boolean | null;
  type: Types.IWarehousingProviderType | null;
  configuration: unknown;
  configurationError: Types.IWarehousingProviderError | null;
  interface: {
    _id: string;
    label: string | null;
    version: string | null;
  } | null;
};

export type IWarehousingProviderFragmentVariables = Exact<{
  [key: string]: never;
}>;

export type ICreateWarehousingProviderMutationVariables = Exact<{
  warehousingProvider: Types.ICreateWarehousingProviderInput;
}>;

export type ICreateWarehousingProviderMutation = {
  createWarehousingProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IWarehousingProviderType | null;
    configuration: unknown;
    configurationError: Types.IWarehousingProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  };
};

export type IRemoveWarehousingProviderMutationVariables = Exact<{
  warehousingProviderId: string | number;
}>;

export type IRemoveWarehousingProviderMutation = {
  removeWarehousingProvider: { _id: string };
};

export type IUpdateWarehousingProviderMutationVariables = Exact<{
  warehousingProvider: Types.IUpdateProviderInput;
  warehousingProviderId: string | number;
}>;

export type IUpdateWarehousingProviderMutation = {
  updateWarehousingProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IWarehousingProviderType | null;
    configuration: unknown;
    configurationError: Types.IWarehousingProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  };
};

export type IWarehousingInterfacesQueryVariables = Exact<{
  providerType?: Types.IWarehousingProviderType | null | undefined;
}>;

export type IWarehousingInterfacesQuery = {
  warehousingInterfaces: Array<{
    _id: string;
    label: string | null;
    value: string;
  }>;
};

export type IWarehousingProviderQueryVariables = Exact<{
  warehousingProviderId: string | number;
}>;

export type IWarehousingProviderQuery = {
  warehousingProvider: {
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IWarehousingProviderType | null;
    configuration: unknown;
    configurationError: Types.IWarehousingProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  } | null;
};

export type IWarehousingProvidersTypeQueryVariables = Exact<{
  [key: string]: never;
}>;

export type IWarehousingProvidersTypeQuery = {
  warehousingProviderType: {
    options: Array<{ value: string; label: string | null }> | null;
  } | null;
};

export type IWarehousingProvidersQueryVariables = Exact<{
  type?: Types.IWarehousingProviderType | null | undefined;
}>;

export type IWarehousingProvidersQuery = {
  warehousingProvidersCount: number;
  warehousingProviders: Array<{
    _id: string;
    created: unknown;
    updated: unknown;
    deleted: unknown;
    isActive: boolean | null;
    type: Types.IWarehousingProviderType | null;
    configuration: unknown;
    configurationError: Types.IWarehousingProviderError | null;
    interface: {
      _id: string;
      label: string | null;
      version: string | null;
    } | null;
  }>;
};

export type IWorkFragment = {
  _id: string;
  type: Types.IWorkType;
  scheduled: unknown;
  status: Types.IWorkStatus;
  started: unknown;
  success: boolean | null;
  finished: unknown;
  created: unknown;
  deleted: unknown;
  retries: number;
  input: unknown;
  result: unknown;
  original: { _id: string; retries: number } | null;
};

export type IWorkFragmentVariables = Exact<{ [key: string]: never }>;

export type IActiveWorkTypesQueryVariables = Exact<{ [key: string]: never }>;

export type IActiveWorkTypesQuery = { activeWorkTypes: Array<Types.IWorkType> };

export type IAddWorkMutationVariables = Exact<{
  type: Types.IWorkType;
  priority?: number;
  input?: unknown;
  originalWorkId?: string | number | null | undefined;
  scheduled?: unknown;
  retries?: number;
}>;

export type IAddWorkMutation = { addWork: { _id: string } | null };

export type IAllocateWorkMutationVariables = Exact<{
  types?: Array<Types.IWorkType | null | undefined> | null | undefined;
  worker?: string | null | undefined;
}>;

export type IAllocateWorkMutation = { allocateWork: { _id: string } | null };

export type IRemoveWorkMutationVariables = Exact<{
  workId: string | number;
}>;

export type IRemoveWorkMutation = { removeWork: { _id: string } };

export type IWorkQueryVariables = Exact<{
  workId: string | number;
}>;

export type IWorkQuery = {
  work: {
    error: unknown;
    priority: number;
    worker: string | null;
    timeout: number | null;
    _id: string;
    type: Types.IWorkType;
    scheduled: unknown;
    status: Types.IWorkStatus;
    started: unknown;
    success: boolean | null;
    finished: unknown;
    created: unknown;
    deleted: unknown;
    retries: number;
    input: unknown;
    result: unknown;
    original: { _id: string; retries: number } | null;
  } | null;
};

export type IWorkQueueQueryVariables = Exact<{
  queryString?: string | null | undefined;
  offset?: number | null | undefined;
  limit?: number | null | undefined;
  status?: Array<Types.IWorkStatus> | null | undefined;
  types?: Array<Types.IWorkType> | null | undefined;
  created?: Types.IDateFilterInput | null | undefined;
  sort?: Array<Types.ISortOptionInput> | null | undefined;
}>;

export type IWorkQueueQuery = {
  activeWorkTypes: Array<Types.IWorkType>;
  workQueueCount: number;
  workQueue: Array<{
    _id: string;
    type: Types.IWorkType;
    scheduled: unknown;
    status: Types.IWorkStatus;
    started: unknown;
    success: boolean | null;
    finished: unknown;
    created: unknown;
    deleted: unknown;
    retries: number;
    input: unknown;
    result: unknown;
    original: { _id: string; retries: number } | null;
  }>;
};
