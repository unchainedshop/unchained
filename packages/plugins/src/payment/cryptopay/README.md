# Cryptopay

curl -X POST http://localhost:4010/payment/cryptopay -d '{ "secret": "secret", "address": "0xF5F72AE7fa1fa990ebaF163208Ed7aD6a3f42DEA", "blockHeight": 7469853, "amount": "50000000000000000", "decimals": 18, "currency": "ETH"}' -H 'Content-Type: application/json'


## HD Key Requirements

Using HD keys allows us to generate "child-keys" for every payment. This helps us link payments to checkouts and improves privacy of the vendor as we don't expose the grand total of revenue the vendor makes on the blockchain directly.

**Bitcoin:**
For the extended HD key we only support native segwit (zpub) format, so if you have a ypub for example, use this tool here to make it the correct format:

https://3rditeration.github.io/btc-extended-key-converter/

**Ethereum:**
For the extended HD key we need an extended public key using the discussed derivation path here:
https://github.com/ethereum/EIPs/issues/84
https://github.com/satoshilabs/slips/blob/master/slip-0044.md

Thus, we are deriving child keys the Metamask way:
m/44'/60'/0'/0/0
m/44'/60'/0'/0/1
m/44'/60'/0'/0/...
