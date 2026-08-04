variable "environment" {
  description = "Environment name, used in resource naming (e.g. dev, staging, prod)"
  type        = string
}

variable "pool_name_prefix" {
  description = "Prefix for the user pool name, e.g. research-tracker"
  type        = string
}

variable "deletion_protection" {
  description = "Whether Cognito should block deletion of this pool. MUST be ACTIVE in prod."
  type        = string
  default     = "INACTIVE"
}

variable "mfa_configuration" {
  description = "MFA requirement for this pool. Dev can be OFF; prod should be OPTIONAL or ON."
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
  type = list(string)
  default = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]
}