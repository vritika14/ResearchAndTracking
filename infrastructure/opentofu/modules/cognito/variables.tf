variable "environment" {
  description = "Environment name, used in resource naming (e.g. dev, staging, prod)"
  type        = string
}

variable "pool_name_prefix" {
  description = "Lowercase prefix for Cognito resources, e.g. research-tracker"
  type        = string
}

variable "callback_urls" {
  description = "Exact OIDC callback URLs allowed for this environment"
  type        = list(string)
}

variable "logout_urls" {
  description = "Exact post-logout URLs allowed for this environment"
  type        = list(string)
}

variable "deletion_protection" {
  description = "Whether Cognito should block deletion of this pool. Use ACTIVE outside disposable dev."
  type        = string
  default     = "INACTIVE"
}

variable "mfa_configuration" {
  description = "MFA requirement for this pool. Dev can be OFF; staging/prod should be reviewed."
  type        = string
  default     = "OFF"
}

variable "access_token_validity_minutes" {
  type    = number
  default = 60
}

variable "id_token_validity_minutes" {
  type    = number
  default = 60
}

variable "refresh_token_validity_days" {
  type    = number
  default = 30
}

variable "explicit_auth_flows" {
  description = "Direct auth flows retained for development/test tooling. Browser login uses OAuth code + PKCE."
  type        = list(string)
  default = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}
