import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { SiweMessage } from "siwe";
import * as jsonwebtoken from "jsonwebtoken";
import { User, Account, Profile, NextAuthOptions } from "next-auth";
import { Provider } from 'next-auth/providers';
import type { JWT, JWTOptions } from "next-auth/jwt";
import { isAddress } from "ethers/lib/utils";

///
export function isProd() {
  return process.env.NODE_ENV === "production";
}

export function getNextAuthURL(): string {
  if (isProd()) {
    return process.env.NEXTAUTH_URL as string;
  } else {
    return process.env.VERCEL_URL || "http://localhost:3000";
  }
}
export enum Roles {
  user = "user",
  anonymous = "anonymous",
}
///

export const SiweProvider = () =>
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
    async authorize(credentials, req) {
      try {
        const siwe = new SiweMessage(JSON.parse(credentials?.message || "{}"));
        const nextAuthUrl = new URL(getNextAuthURL());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nonce = await getCsrfToken({ req: req as any });
        const result = await siwe.verify({
          signature: credentials?.signature || "",
          domain: nextAuthUrl.host,
          nonce,
        });
        console.log({ result, siwe });
        if (result.success) {
          return {
            id: siwe.address,
            name: siwe.address,
            address: siwe.address,
            chainId: siwe.chainId,
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },
  });

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

const refreshAccessToken = async (token: JWT) => {
  console.log("refreshing access token", { token });
  return token;
};

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

export const providers: Array<Provider> = [SiweProvider()];

// Authorize cookie for hasura app https://github.com/nextauthjs/next-auth/issues/405#issuecomment-737593528
const useSecureCookies = getNextAuthURL().startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";
const hostName = new URL(getNextAuthURL()).hostname;

export const authOptions: NextAuthOptions = {
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        // authorize cookie for subdomain, inc. hasura app (strip www. from hostName)
        domain:
          hostName === "localhost"
            ? hostName
            : "." + hostName.replace(/^www\./, ""),
      },
    },
  },
  session: {
    strategy: "jwt",
    maxAge:
      parseInt(process.env.TOKEN_LIFE_TIME as string) || 30 * 24 * 60 * 60, // 30 days
  },
  debug: !isProd(),
  providers,
  // adapter: adapter(),
  pages: {
    signIn: undefined,
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  theme: {
    colorScheme: "auto",
  },
  jwt: jwtOptions,
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
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
          role: Roles.user,
        };
      } else {
        Object.assign(token, {
          role: token.user ? Roles.user : Roles.anonymous,
        });
      }
      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
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
  },
};

export default NextAuth(authOptions);

// export const jwtOptions: JWTOptions = {
//   secret: process.env.NEXTAUTH_SECRET as string,
//   maxAge: parseInt(process.env.TOKEN_LIFE_TIME as string) || 30 * 24 * 60 * 60, // 30 days
//   encode: async ({ secret, token: payload }) =>
//     jsonwebtoken.sign(payload!, secret, {
//       algorithm: "RS256",
//     }),
//   decode: async ({ secret, token }) => {
//     const decodedToken = jsonwebtoken.verify(token!, secret, {
//       algorithms: ["RS256"],
//     });
//     return decodedToken as JWT;
//   },
// };

// const refreshAccessToken = async (token: JWT) => {
//   try {
//     // how to refresh the access token ?
//     return token;
//   } catch (error) {
//     return { ...token, error: "RefreshAccessTokenError" };
//   }
// };

// export default async function auth(req: any, res: any) {
//   const providers = [
//     CredentialsProvider({
//       name: "Ethereum",
//       credentials: {
//         message: {
//           label: "Message",
//           type: "text",
//           placeholder: "0x0",
//         },
//         signature: {
//           label: "Signature",
//           type: "text",
//           placeholder: "0x0",
//         },
//       },
//       async authorize(credentials) {
//         try {
//           const siwe = new SiweMessage(
//             JSON.parse(credentials?.message || "{}")
//           );
//           const nextAuthUrl = new URL(process.env.NEXTAUTH_URL as string);

//           const result = await siwe.verify({
//             signature: credentials?.signature || "",
//             domain: nextAuthUrl.host,
//             nonce: await getCsrfToken({ req }),
//           });
//           console.log({ result, siwe });

//           if (result.success) {
//             return {
//               id: siwe.address,
//             };
//           }
//           return null;
//         } catch (e) {
//           return null;
//         }
//       },
//     }),
//   ];

//   // const isDefaultSigninPage =
//   //   req.method === "GET" && req.query.nextauth.includes("signin");

//   // // Hide Sign-In with Ethereum from default sign page
//   // if (isDefaultSigninPage) {
//   //   providers.pop();
//   // }

//   return await NextAuth(req, res, {
//     // https://next-auth.js.org/configuration/providers/oauth
//     providers,
//     session: {
//       strategy: "jwt",
//     },
//     jwt: jwtOptions,
//     secret: process.env.NEXTAUTH_SECRET,
//     callbacks: {
//       async session({ session, token }) {
//         session.user = token.user as User;
//         session.error = token.error as string;
//         if (isAddress(token.sub as string)) {
//           session.address = token.sub as string;
//           session.user.name = token.sub;
//         }
//         return session;
//       },
//       async jwt(args) {
//         const {
//           token,
//           user,
//           account,
//           profile,
//           isNewUser,
//         }: {
//           token: JWT;
//           user?: User;
//           profile?: Profile;
//           account?: Account | null;
//           isNewUser?: boolean;
//         } = args;
//         // First time user sign in
//         if (user && account) {
//           return {
//             accessToken: account.access_token,
//             accessTokenExpires:
//               Date.now() + (account?.expires_at as number) * 1000,
//             refreshToken: account.refresh_token,
//             user: { ...user, name: profile?.name },
//             provider: account.provider,
//             providerType: account.type,
//             role: "user",
//           };
//         } else {
//           Object.assign(token, {
//             role: token.user ? "user" : "anonymous",
//           });
//         }
//         // Return previous token if the access token has not expired yet
//         if (Date.now() < (token.accessTokenExpires as number)) {
//           return token;
//         }
//         // Access token has expired, try to update it
//         return refreshAccessToken(token);
//       },
//     },
//   });
// }
