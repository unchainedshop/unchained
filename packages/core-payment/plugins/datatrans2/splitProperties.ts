// This method splits the return data of alias registration to the important properties needed for validation and the additional data

export default function splitProperties({
  objectKey,
  payload,
}: {
  objectKey?: string;
  payload: any;
}): {
  token?: string;
  info: any;
  _id?: string;
} {
  if (!payload || !objectKey) return { info: {} };

  if (objectKey === 'card') {
    const { expiryMonth, alias, expiryYear, ...info } = payload;
    const is3DActive = !!payload['3D']?.xid;
    if (is3DActive) {
      delete info['3D'];
    }
    return {
      token: JSON.stringify({
        alias,
        expiryMonth,
        expiryYear,
        '3D': is3DActive ? payload['3D'] : undefined,
      }),
      info,
    };
  }

  if (objectKey === 'PAY') {
    const { signature, protocolVersion, signedMessage, ...info } = payload;
    return {
      token: JSON.stringify({
        signature,
        protocolVersion,
        signedMessage,
      }),
      info,
    };
  }

  if (objectKey === 'APL') {
    const { data, header, signature, version, ...info } = payload;
    delete info['3D'];
    return {
      token: JSON.stringify({
        data,
        header,
        signature,
        version,
      }),
      info,
    };
  }

  const { alias, ...info } = payload;
  return { token: alias ? JSON.stringify({ alias }) : undefined, info };
}
