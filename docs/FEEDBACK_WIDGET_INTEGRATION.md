# Tester feedback widget integration

The portal loads the feedback widget only when a server-issued public app ID is present at build time. Without that value, no launcher or feedback endpoint is exposed to visitors.

## Required deployment values

Set these values in the deployment environment; do not commit them to source control:

```text
PUBLIC_FEEDBACK_APP_ID=<the appId registered for still-coding.com>
PUBLIC_FEEDBACK_BASE_URL=https://user-feedback.still-coding.com
```

`PUBLIC_FEEDBACK_APP_ID` identifies the portal; it is not a secret. The feedback service must still authenticate the tester session and authorize every form-open, upload, submit, and read request. A missing or invalid session must be rejected by the service, including requests made directly to its API.

## Server prerequisites

Before enabling the value, confirm that the service supports expiring and revocable tester sessions, per-app origin authorization, CSRF protection for cookie sessions, upload validation, server-side rate limits with `429` responses, and separate operator authorization for feedback history. The portal does not attempt to reproduce these controls in client-side code.

The widget script is loaded once by the shared layout from `/widget/common-feedback-widget.js`. The service owns launcher visibility and its official API. This site does not add click gestures, localStorage unlock flags, token forwarding, DOM event interception, or automatic screenshots/log uploads.

If the service changes its public widget path or initialization contract, update `FeedbackWidget.astro` only after verifying the new official contract.
