# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - region "Notifications Alt+T"
    - img "Logo" [ref=e4]
    - button "auto" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - heading "Log in to your account" [level=2] [ref=e13]
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic "Username/Email" [ref=e18]
          - textbox "Username/Email" [active] [ref=e19]
        - button "Continue" [ref=e21]:
          - img [ref=e23]
          - text: Continue
        - generic [ref=e25]:
          - text: Create new account?
          - link "Sign up" [ref=e26] [cursor=pointer]:
            - /url: /sign-up/
  - button "Open Next.js Dev Tools" [ref=e32] [cursor=pointer]:
    - img [ref=e33]
  - alert [ref=e36]
```