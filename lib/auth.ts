import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs"


export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.email || !credentials?.password) return null;

                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                    });
                    console.log("User found:", user);

                    if (!user) return null;

                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );
                    console.log("Password valid:", isValid);

                    if (!isValid) return null;

                    return { id: String(user.id), name: user.name, email: user.email };
                } catch (err) {
                    console.error("Authorize error:", err);
                    return null; // jangan lempar error, supaya tidak redirect ke /api/auth/error
                }
            },
        }),
    ],
    pages: { signIn: "/admin/login" },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
};
