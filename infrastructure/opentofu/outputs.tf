output "user_pool_id" {
  description = "Cognito User Pool ID."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_client_id" {
  description = "App client ID used by apps/web."
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  description = "Hosted UI domain — used for VITE_COGNITO_DOMAIN and the sign-in/sign-out redirect URLs."
  value       = "${aws_cognito_user_pool_domain.this.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "cognito_authority" {
  description = "OIDC authority/issuer URL — used for VITE_COGNITO_AUTHORITY."
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}
