// This method splits the return data of alias registration to the important properties needed for validation and the additional data

export default function splitProperties({ objectKey, payload }: { objectKey?: string; payload: any }): {
  token?: string;
  info: any;
} {
  if (!payload || !objectKey) return { info: {} };

  if (objectKey === 'card') {
    const { expiryMonth, alias, expiryYear, ...info } = payload;
    if (!alias) return { info };
    const is3DActive = !!payload['3D']?.xid;
    if (is3DActive) {
      delete info['3D'];
    }
    const token = JSON.stringify({
      alias,
      expiryMonth,
      expiryYear,
      '3D': is3DActive ? payload['3D'] : undefined,
    });
    return {
      token,
      info,
    };
  }

  if (objectKey === 'PAY') {
    const { signature, protocolVersion, signedMessage, ...info } = payload;
    if (!signedMessage) return { info };
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
    if (!data) return { info };
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
