import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDatabase } from "@/lib/mongodb"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { db } = await connectToDatabase()
          
          const user = await db.collection('users').findOne({ 
            username: credentials.username 
          })

          if (!user) {
            throw new Error('No user found with this email')
          }

          const isValid = credentials.password === user.password
          
          if (!isValid) {
            throw new Error('Invalid password')
          }

          return {
            id: user._id.toString(),
            username: user.username,
            name: user.name,
            // Any other user data to include in the session
          }

        } catch (error) {
          if (error.name === 'MongoNetworkError' || 
              error.name === 'MongoServerSelectionError' ||
              error.code === 'ETIMEDOUT') {
            throw new Error('Database connection failed. Please try again later.')
          }
          throw new Error(error.message || 'Authentication failed')
        }
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }