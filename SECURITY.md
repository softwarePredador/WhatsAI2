# 🔒 Security Notice

This repository contains development and example configurations only.

## 🔑 API Keys and Secrets

- **Evolution API Key**: The key `Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl` is a **development/demo key** provided for testing purposes
- **JWT Secret**: Development secret, not used in production
- **Database URLs**: Supabase demo database for development only

## 🛡️ Production Security

For production deployment:

1. **Replace all keys** with production values
2. **Use environment variables** 
3. **Never commit real secrets** to version control
4. **Use secret management** services (AWS Secrets Manager, etc.)

## 📋 GitGuardian Configuration

This repository includes `.gitguardian.yaml` to ignore development keys and prevent false positives in security scanning.

## 🔄 Development vs Production

| Environment | API Key | JWT Secret | Database |
|-------------|---------|------------|----------|
| Development | Demo key (committed) | Demo secret | Demo DB |
| Production | Environment variable | Environment variable | Production DB |

**Note**: All committed secrets are development-only and safe to expose.