import fetch from 'isomorphic-unfetch';
import xml2js from 'xml2js';

const datatransAuthorize = async ({
  endpoint,
  secret,
  merchantId,
  refno,
  amount,
  currency,
  aliasCC,
  expm,
  expy,
  pmethod,
}) => {
  const body = `
<?xml version="1.0" encoding="UTF-8" ?>
<authorizationService version="6">
<body merchantId="${merchantId}">
<transaction refno="${refno}">
<request>
  <amount>${amount}</amount>
  <currency>${currency}</currency>
  <aliasCC>${aliasCC}</aliasCC>
  <pmethod>${pmethod}</pmethod>
  <expm>${expm}</expm>
  <expy>${expy}</expy>
</request>
</transaction>
</body>
</authorizationService>`;
  const result = await fetch(`${endpoint}/upp/jsp/XML_authorize.jsp`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/xml',
      Authorization: `Basic ${secret}`,
    },
  });
  const xml = await result.text();
  return xml2js.parseStringPromise(xml);
};

export default datatransAuthorize;
