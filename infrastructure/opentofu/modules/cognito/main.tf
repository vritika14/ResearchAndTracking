resource "aws_cognito_user_pool" "this" {
  name = "${var.pool_name_prefix}-${var.environment}"

  username_attributes       = ["email"]
  auto_verified_attributes  = ["email"]

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

resource "aws_cognito_user_pool_client" "api" {
  name         = "${var.pool_name_prefix}-api-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id

  generate_secret = false

  explicit_auth_flows = var.explicit_auth_flows

  access_token_validity  = var.access_token_validity_minutes
  id_token_validity      = var.id_token_validity_minutes
  refresh_token_validity = var.refresh_token_validity_days

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

data "aws_region" "current" {}