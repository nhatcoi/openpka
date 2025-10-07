// NextAuth configuration
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '../db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                identifier: { label: 'Username or Email', type: 'text', placeholder: 'ziet' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.identifier || !credentials?.password) {
                        console.log('Missing credentials');
                        return null
                    }

                    console.log('Looking for user:', credentials.identifier);

                    // Tìm user bằng email hoặc username
                    const user = await db.user.findFirst({
                        where: {
                            OR: [
                                { email: credentials.identifier },
                                { username: credentials.identifier }
                            ]
                        }
                    })

                    if (!user) {
                        console.log('User not found');
                        return null
                    }

                    console.log('User found:', user.username);

                    // So sánh password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password_hash
                    )

                    if (!isPasswordValid) {
                        console.log('Invalid password');
                        return null
                    }

                    console.log('Password valid, getting permissions...');

                    // Lấy permissions của user thông qua roles
                    const userRoles = await db.userRole.findMany({
                        where: { user_id: user.id },
                        include: {
                            Role: {
                                include: {
                                    RolePermission: {
                                        include: {
                                            Permission: true
                                        }
                                    }
                                }
                            }
                        }
                    });

                    console.log('User roles found:', userRoles.length);

                    // Flatten permissions từ tất cả roles
                    const permissions = userRoles.flatMap(ur =>
                        ur.Role.RolePermission.map(rp => rp.Permission.name)
                    );

                    console.log('Permissions:', permissions);

                    return {
                        id: user.id.toString(),
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        permissions: permissions
                    }
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },

        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            return true // Cho phép đăng nhập
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.permissions = (user as { permissions: string[] }).permissions
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.permissions = token.permissions as string[]
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            // Nếu đăng nhập thành công, redirect về /hr/dashboard
            if (url === baseUrl || url === `${baseUrl}/`) {
                return `${baseUrl}/hr/dashboard`
            }
            // Nếu có callbackUrl, sử dụng nó
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`
            }
            // Nếu là URL đầy đủ, kiểm tra xem có phải cùng domain không
            if (url.startsWith(baseUrl)) {
                return url
            }
            // Mặc định redirect về /hr/dashboard
            return `${baseUrl}/hr/dashboard`
        }
    },
    pages: {
        signIn: '/auth/signin',
    }
}