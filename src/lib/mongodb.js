// lib/mongodb.js
import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

const MONGODB_URI = process.env.MONGODB_URI

// Custom error types for better error handling
export class DatabaseConnectionError extends Error {
  constructor(message, originalError) {
    super(message)
    this.name = 'DatabaseConnectionError'
    this.originalError = originalError
    this.code = 'DB_CONNECTION_ERROR'
  }
}

let cachedClient = null
let cachedDb = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  try {
    const client = await MongoClient.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Quick timeout for faster error feedback
      socketTimeoutMS: 30000,
    })

    const db = client.db()

    // Cache the connection
    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    
    let userMessage = 'Unable to connect to the database'
    if (error.name === 'MongoNetworkError') {
      userMessage = 'Network error: Unable to reach the database server'
    } else if (error.name === 'MongoServerSelectionError') {
      userMessage = 'Server selection timeout: Database servers are unreachable'
    } else if (error.code === 'ETIMEDOUT') {
      userMessage = 'Connection timed out: Database is not responding'
    }

    throw new DatabaseConnectionError(userMessage, error)
  }
}

export async function checkDatabaseConnection() {
  try {
    const { db } = await connectToDatabase()
    await db.command({ ping: 1 })
    return { isConnected: true }
  } catch (error) {
    return { 
      isConnected: false, 
      error: error instanceof DatabaseConnectionError ? error.message : 'Database connection failed'
    }
  }
}