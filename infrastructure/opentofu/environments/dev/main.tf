module "cognito" {
  source = "../../modules/cognito"

  environment      = "dev"
  pool_name_prefix = "research-tracker"

  deletion_protection = "INACTIVE"
  mfa_configuration   = "OFF"

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]
}

output "user_pool_id" {
  value = module.cognito.user_pool_id
}

output "app_client_id" {
  value = module.cognito.app_client_id
}

output "issuer_url" {
  value = module.cognito.issuer_url
}