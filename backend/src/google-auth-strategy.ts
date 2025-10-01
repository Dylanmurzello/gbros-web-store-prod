import {
  AuthenticationStrategy,
  ExternalAuthenticationService,
  Injector,
  RequestContext,
  User,
} from '@vendure/core';
import { OAuth2Client } from 'google-auth-library';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export interface GoogleAuthOptions {
  googleClientId: string;
}

export interface GoogleAuthData {
  token: string;
}

export class GoogleAuthenticationStrategy implements AuthenticationStrategy<GoogleAuthData> {
  readonly name = 'google';
  private client: OAuth2Client;
  private externalAuthenticationService: ExternalAuthenticationService;

  constructor(private options: GoogleAuthOptions) {
    this.client = new OAuth2Client(options.googleClientId);
  }

  init(injector: Injector) {
    this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
  }

  defineInputType(): DocumentNode {
    return gql`
      input GoogleAuthInput {
        token: String!
      }
    `;
  }

  async authenticate(ctx: RequestContext, data: GoogleAuthData): Promise<User | false> {
    try {
      let payload: any;

      // First try to verify as an ID token
      try {
        const ticket = await this.client.verifyIdToken({
          idToken: data.token,
          audience: this.options.googleClientId,
        });
        payload = ticket.getPayload();
      } catch (idTokenError) {
        // If ID token verification fails, try to get user info using access token
        // This is normal for certain OAuth flows, so we silently fall back

        try {
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          });

          if (!userInfoResponse.ok) {
            console.error('Failed to fetch user info with access token');
            return false;
          }

          const userInfo = await userInfoResponse.json();

          // Map the userinfo response to match the ID token payload structure
          payload = {
            sub: userInfo.sub,
            email: userInfo.email,
            email_verified: userInfo.email_verified,
            given_name: userInfo.given_name,
            family_name: userInfo.family_name,
            name: userInfo.name,
            picture: userInfo.picture,
          };
        } catch (accessTokenError) {
          console.error('Access token verification also failed:', accessTokenError);
          return false;
        }
      }

      if (!payload || !payload.email) {
        console.error('Google OAuth: No payload or email in token');
        return false;
      }

      // Check if a user already exists with this Google ID
      const existingUser = await this.externalAuthenticationService.findCustomerUser(
        ctx,
        this.name,
        payload.sub // Google's unique user ID
      );

      if (existingUser) {
        // User already exists, return them
        return existingUser;
      }

      // Create a new user for first-time Google sign-in
      const createdUser = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
        strategy: this.name,
        externalIdentifier: payload.sub,
        verified: payload.email_verified || false,
        emailAddress: payload.email,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
      });

      return createdUser;
    } catch (error) {
      console.error('Google OAuth authentication error:', error);
      return false;
    }
  }
}