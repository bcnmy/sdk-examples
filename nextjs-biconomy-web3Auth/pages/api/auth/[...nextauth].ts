import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import * as jsonwebtoken from "jsonwebtoken";
import { NextAuthOptions, User, Account, Profile } from "next-auth";
import type { JWT, JWTOptions } from "next-auth/jwt";
import { isAddress } from 'ethers/lib/utils';

export const jwtOptions: JWTOptions = {
  secret: process.env.NEXTAUTH_SECRET as string,
  maxAge: parseInt(process.env.TOKEN_LIFE_TIME as string) || 30 * 24 * 60 * 60, // 30 days
  encode: async ({ secret, token: payload }) =>
    jsonwebtoken.sign(payload!, secret, {
      algorithm: "RS256",
    }),
  decode: async ({ secret, token }) => {
    const decodedToken = jsonwebtoken.verify(token!, secret, {
      algorithms: ["RS256"],
    });
    // run some checks on the returned payload, perhaps you expect some specific values

    // if its all good, return it, or perhaps just return a boolean
    return decodedToken as JWT;
  },
};

const refreshAccessToken = async (token: JWT) => {
  try {
    console.log("refreshing access token", { token });
    // how to refresh the access token ?
    return token;
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
};

export default async function auth(req: any, res: any) {
  const providers = [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials) {
        try {
          const siwe = new SiweMessage(
            JSON.parse(credentials?.message || "{}")
          );
          const nextAuthUrl = new URL(process.env.NEXTAUTH_URL as string);

          const result = await siwe.verify({
            signature: credentials?.signature || "",
            domain: nextAuthUrl.host,
            nonce: await getCsrfToken({ req }),
          });
          console.log({ result, siwe });

          if (result.success) {
            return {
              id: siwe.address,
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      },
    }),
  ];

  const isDefaultSigninPage =
    req.method === "GET" && req.query.nextauth.includes("signin");

  // Hide Sign-In with Ethereum from default sign page
  if (isDefaultSigninPage) {
    providers.pop();
  }

  return await NextAuth(req, res, {
    // https://next-auth.js.org/configuration/providers/oauth
    providers,
    session: {
      strategy: "jwt",
    },
    jwt: jwtOptions,
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      async session({ session, token }) {
        // needed for hasura claims_map
        session.user = token.user as User;
        // used to detect if provider with same email exists
        session.error = token.error as string;
        // handle when user is logged in with siwe
        if (isAddress(token.sub as string)) {
          session.address = token.sub as string;
          session.user.name = token.sub;
        }
        return session;
      },
      // Add hasura data needed for claims_map + accessToken
      async jwt(args) {
        const {
          token,
          user,
          account,
          profile,
          isNewUser,
        }: {
          token: JWT;
          user?: User;
          profile?: Profile;
          account?: Account | null;
          isNewUser?: boolean;
        } = args;
        // First time user sign in
        if (user && account) {
          return {
            accessToken: account.access_token,
            accessTokenExpires:
              Date.now() + (account?.expires_at as number) * 1000,
            refreshToken: account.refresh_token,
            user: { ...user, name: profile?.name },
            provider: account.provider,
            providerType: account.type,
            role: "user",
          };
        } else {
          Object.assign(token, {
            role: token.user ? "user" : "anonymous",
          });
        }
        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.accessTokenExpires as number)) {
          return token;
        }
        // Access token has expired, try to update it
        return refreshAccessToken(token);
      },
    },
  });
}
