data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

resource "aws_cognito_user_pool" "this" {
  name = "${var.pool_name_prefix}-${var.environment}"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  deletion_protection = var.deletion_protection
  mfa_configuration   = var.mfa_configuration

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "opentofu"
  }
}

# Cognito managed-login/OIDC endpoints do not exist until the user pool has a domain.
# The AWS account id gives the development domain a deterministic globally-unique suffix.
resource "aws_cognito_user_pool_domain" "this" {
  domain       = "${var.pool_name_prefix}-${var.environment}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.pool_name_prefix}-web-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id

  # Browser apps are public clients. Never generate/embed a client secret.
  generate_secret = false

  explicit_auth_flows = var.explicit_auth_flows

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  supported_identity_providers         = ["COGNITO"]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true

  access_token_validity  = var.access_token_validity_minutes
  id_token_validity      = var.id_token_validity_minutes
  refresh_token_validity = var.refresh_token_validity_days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}
