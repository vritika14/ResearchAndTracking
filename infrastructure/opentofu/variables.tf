variable "project_name" {
  description = "Short name used to prefix all resources."
  type        = string
  default     = "research-tracker"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region to provision Cognito resources in."
  type        = string
  default     = "us-east-1"
}

variable "callback_urls" {
  description = "URLs Cognito is allowed to redirect back to after sign-in. Add production URLs before deploying beyond local dev."
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "logout_urls" {
  description = "URLs Cognito is allowed to redirect back to after sign-out. Add production URLs before deploying beyond local dev."
  type        = list(string)
  default     = ["http://localhost:5173/"]
}

variable "cognito_domain_prefix" {
  description = "Prefix for the Cognito Hosted UI domain (<prefix>-<environment>.auth.<region>.amazoncognito.com). Must be globally unique across all AWS accounts — pick something specific to this project, e.g. \"research-tracker-yourname\"."
  type        = string
}

variable "min_password_length" {
  description = "Minimum password length enforced by the user pool."
  type        = number
  default     = 12
}
