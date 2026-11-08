# Local Auth JWKS key

Auth requires a private RSA key in `AUTH_JWT_PRIVATE_KEY` and a stable key ID in
`AUTH_JWT_KEY_ID`. The value may be a PEM string with real newlines or `\n`
escapes. Keep the private key in the ignored local `.env` file or a secret
manager; never commit it.

Generate a development key in the repository root:

```sh
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out .auth-jwt-private.pem
```

Copy the contents of `.auth-jwt-private.pem` into a quoted multiline value in
`.env`, and set `AUTH_JWT_KEY_ID=local-dev-1`. Do not print the key in shared
logs or terminal transcripts. The `.auth-jwt-private.pem` file is ignored by
Git. Delete it after placing the value in `.env` if the local workflow does not
need the file anymore.

Auth derives the public RSA JWK from the private key and serves it at
`GET /.well-known/jwks.json`. The endpoint includes `kid`, `kty`, and `alg`, and
never returns private JWK parameters. Startup fails when the key or key ID is
missing, malformed, non-RSA, or smaller than 2048 bits.
