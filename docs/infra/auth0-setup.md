# Auth0 Setup

This document covers the setup process for Auth0, our authentication and user management service. This service is used starting in v0.4 of the GolferGeek AI project.

## Creating an Auth0 Tenant

1. **Sign Up/Login to Auth0**
   - Visit [Auth0](https://auth0.com/)
   - Create an account or log in

2. **Create a New Tenant**
   - Name: `golfergeek`
   - Region: US or closest to your users
   - Environment: Development

## Application Setup

1. **Create Regular Web Application**
   - Name: `GolferGeek API`
   - Application Type: Regular Web Applications
   
   Configure:
   - Allowed Callback URLs: `http://localhost:3333/api/auth/callback, https://api.golfergeek.com/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:8080, https://golfergeek.com`
   - Allowed Web Origins: `http://localhost:8080, https://golfergeek.com`
   
   Record:
   - Domain
   - Client ID
   - Client Secret

2. **Create Single Page Application**
   - Name: `GolferGeek Web`
   - Application Type: Single Page Application
   
   Configure:
   - Allowed Callback URLs: `http://localhost:8080/callback, https://golfergeek.com/callback`
   - Allowed Logout URLs: `http://localhost:8080, https://golfergeek.com`
   - Allowed Web Origins: `http://localhost:8080, https://golfergeek.com`
   
   Record:
   - Domain
   - Client ID

## API Configuration

1. **Create API**
   - Name: `GolferGeek API`
   - Identifier (audience): `https://api.golfergeek.com`
   - Signing Algorithm: RS256

2. **Define Permissions**
   - `read:profile` - Read user profile information
   - `write:profile` - Update user profile
   - `read:aikeys` - View stored API keys
   - `write:aikeys` - Create/update API keys
   - `admin` - Administrative functions

## Roles Setup

1. **Create Roles**
   - `user` - Basic user with normal permissions
   - `admin` - Admin user with full access
   
2. **Assign Permissions to Roles**
   - `user`: `read:profile`, `write:profile`, `read:aikeys`, `write:aikeys`
   - `admin`: All permissions

## Rules Setup

1. **Add Rule for Admin Users**
   ```javascript
   function (user, context, callback) {
     // List of admin user IDs (Auth0 user_id)
     const adminUsers = [
       'auth0|ADMIN_USER_ID_1',
       'auth0|ADMIN_USER_ID_2'
     ];
     
     if (adminUsers.includes(user.user_id)) {
       context.accessToken['https://api.golfergeek.com/roles'] = ['admin'];
     } else {
       context.accessToken['https://api.golfergeek.com/roles'] = ['user'];
     }
     
     callback(null, user, context);
   }
   ```

## Connection Details for Application

```
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_AUDIENCE=https://api.golfergeek.com
AUTH0_CLIENT_ID=<client-id>
AUTH0_CLIENT_SECRET=<client-secret>
```

> **NOTE: Do not commit these credentials to Git. Use environment variables instead.**

## Testing the Setup

1. **Auth Flow Test**
   - Visit: `https://<tenant>.auth0.com/authorize?response_type=code&client_id=<client-id>&redirect_uri=http://localhost:8080/callback&scope=openid%20profile%20email`
   - Should redirect to login page
   
2. **Get a Test Token**
   - Use Auth0 Dashboard > Applications > APIs > Test to generate a token
   - Use with: `curl -H "Authorization: Bearer <token>" http://localhost:3333/api/health`

## Local Development

During development, you can use the Auth0 tenant directly. No local alternative is provided since Auth0 has a generous free tier.

---

*Add your actual Auth0 details below after setup:*

**Auth0 Tenant Domain:** <!-- Add here but DO NOT COMMIT! -->

**Auth0 Dashboard URL:** <!-- Add here -->

**Created By:** <!-- Your name -->

**Creation Date:** <!-- Date --> 