---
sidebar_position: 10
title: Quotations
sidebar_label: Quotations

---

:::
Configure the Quotation Module
:::


- quotationNumberHashFn: `(quotation: Quotation, index: number) => string | number` function to retrieve a unique generated quotationNumber, default is a hashids based function that generates an alphanumeric uppercase string with length 6. If the number has already been taken, the function gets iteratively called with an increasing `index`

Example custom configuration:

```
const options = {
  modules: {
    quotations: {
      quotationNumberHashFn: (quotation, index) => (quotation.sequence + 200000 + index)
    },
  }
};
```


