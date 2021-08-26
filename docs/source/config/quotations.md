---
title: 'Module: Enrollments'
description: Configure the Quotation Module
---

- quotationNumberHashFn: `(quotation: Quotation, try: int) => string | number` function to retrieve a unique generated quotationNumber, default is a hashids based function that generates an alphanumeric uppercase string with length 6. If the number has already been taken, the function gets iteratively called with an increasing `try`

Example custom configuration:

```
const options = {
  modules: {
    quotations: {
      quotationNumberHashFn: (quotation, try) => (quotation.sequence + 200000 + try)
    },
  }
};
```
