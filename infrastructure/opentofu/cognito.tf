resource "aws_cognito_user_pool" "this" {
  name = "${var.project_name}-${var.environment}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = var.min_password_length
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Dev default — revisit before this pool is used beyond local development.
  mfa_configuration = "OFF"
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-web-client"
  user_pool_id = aws_cognito_user_pool.this.id

  # Public SPA client — no client secret can be kept confidential in browser
  # JS. PKCE (code_challenge/code_verifier) replaces it for the Authorization
  # Code flow used by apps/web.
  generate_secret = false

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = ["COGNITO"]

  # Only refresh-token grant needed server-side; interactive sign-in goes
  # through the Hosted UI, not a direct SRP/password grant.
  explicit_auth_flows = ["ALLOW_REFRESH_TOKEN_AUTH"]

  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 1
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.cognito_domain_prefix}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id
}
