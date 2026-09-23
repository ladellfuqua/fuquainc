# Contact delivery

The `/contact` page posts to the Vercel function at `/api/contact`. The function validates the submission and sends it through Resend. It does not store messages or send visitor auto-replies.

## Required production settings

In the `fuqua-inc/fuquainc` Vercel project, configure:

- `RESEND_API_KEY`: a valid Resend sending key authorized for `fuquainc.com`.
- `CONTACT_TO_EMAIL`: the owner's private destination inbox.

Set both for **Production**, and redeploy after adding or changing them. Preview deployments need separate environment settings if delivery is to be tested there. The sender is `FUQUA INC. Website <contact@fuquainc.com>`; the domain must be verified in Resend. The visitor's address is used only as Reply-To, never as the sender.

Enter secrets directly in Vercel. Do not place keys, the private destination, or submitted messages in GitHub, Linear, screenshots, public bundles, or logs.

## Verification

`npm run quality` includes mocked contact-delivery tests; these never send email. The production build also rejects absent or blank delivery settings. Neither check proves that a key is valid or that a message reached the inbox.

After configuring and deploying, get the owner's authorization to send a clearly labeled test through the live form. Confirm the success screen, provider delivery status, inbox receipt, and visitor Reply-To. An API success means the provider accepted the message, not that the inbox received it.

## Diagnosing failures

The function emits `contact_api_failure` with a non-personal error code:

| Code | Check |
| --- | --- |
| `configuration_missing` | Required settings exist on the active deployment's environment; redeploy after saving them. |
| `resend_http_failure` | Upstream status, key authorization, verified domain, and provider sending limits. |
| `resend_timeout` / `resend_network_failure` | Provider status and connectivity. |

Validation failures return 400; rate limits return 429 with Retry-After. Honeypot submissions return a silent success without sending. Failed messages are not stored for later delivery, so affected visitors need to resubmit once service is restored.
