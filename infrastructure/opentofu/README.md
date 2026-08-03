# OpenTofu — Cognito

Provisions the AWS Cognito User Pool and App Client that `apps/web` authenticates against.

## Prerequisites

- [OpenTofu](https://opentofu.org/docs/intro/install/) installed (`tofu -v`)
- AWS credentials configured (e.g. `aws configure`, or environment variables) for an account you're allowed to create Cognito resources in

## Usage

```bash
cd infrastructure/opentofu
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars — cognito_domain_prefix must be globally unique

tofu init
tofu plan
tofu apply
```

Copy the outputs into `apps/web/.env` (copy `apps/web/.env.example` first if you haven't):

```bash
tofu output -json
```

- `cognito_authority` → `VITE_COGNITO_AUTHORITY`
- `user_pool_client_id` → `VITE_COGNITO_CLIENT_ID`
- `cognito_domain` → `VITE_COGNITO_DOMAIN`

`VITE_COGNITO_REDIRECT_URI`, `VITE_COGNITO_LOGOUT_URI`, and `VITE_COGNITO_SCOPE` don't come from Terraform output — set them directly in `.env` (defaults matching local dev are in `.env.example`).

## Notes

- State is local (no remote backend configured) — fine for single-user dev, but revisit before this is shared across a team or used for a real deployment.
- The app client has `generate_secret = false`: it's a public SPA client, and PKCE (not a client secret) protects the Authorization Code flow.
- `mfa_configuration = "OFF"` and the password policy in `cognito.tf` are dev defaults — harden before production use.
