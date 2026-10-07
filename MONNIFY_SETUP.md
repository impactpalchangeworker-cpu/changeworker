# Monnify Setup

Configure these server-only environment variables in the deployment environment and local `.env.local` file:

```bash
MONNIFY_API_KEY=your_api_key
MONNIFY_SECRET_KEY=your_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com
MONNIFY_DISBURSEMENT_ACCOUNT_NUMBER=your_approved_source_account
NEXT_PUBLIC_APP_URL=https://changeworker.ng
```

Use `https://api.monnify.com` for `MONNIFY_BASE_URL` only after the live account is approved and tested.

In the Monnify dashboard, configure the Transaction Completion, Disbursement, and Refund webhook URLs to:

```text
https://changeworker.ng/api/monnify/webhook
```

Enable disbursements, provide Monnify with the production server's static outbound IP address, and complete a sandbox payment, payout, and refund test before going live. The application verifies completed payments server-to-server and validates webhook signatures in production.
