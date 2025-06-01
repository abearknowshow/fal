import jwt from 'jsonwebtoken';

interface JWTPayload {
  iss: string;
  exp: number;
  nbf: number;
}

/**
 * Generate a JWT token for Kling AI API authentication
 * Based on: https://www.pythonbid.com/post/how-to-use-the-kling-ai-api-for-image-generation
 */
export function generateKlingJWT(accessKey: string, secretKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  
  const payload: JWTPayload = {
    iss: accessKey,  // Your Access Key (AK)
    exp: now + 1800, // Token expires in 30 minutes
    nbf: now - 5     // Token is valid 5 seconds from now
  };

  const header = {
    alg: 'HS256' as const,
    typ: 'JWT' as const
  };

  return jwt.sign(payload, secretKey, { 
    header,
    algorithm: 'HS256'
  });
}

/**
 * Check if a JWT token is expired or near expiry
 */
export function isJWTExpiring(token: string, bufferMinutes: number = 5): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const expiryBuffer = bufferMinutes * 60;
    
    return decoded.exp <= (now + expiryBuffer);
  } catch {
    return true;
  }
}

/**
 * JWT Token manager for Kling AI API
 */
export class KlingJWTManager {
  private accessKey: string;
  private secretKey: string;
  private currentToken: string | null = null;

  constructor(accessKey: string, secretKey: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }

  /**
   * Get a valid JWT token, generating a new one if needed
   */
  getValidToken(): string {
    if (!this.currentToken || isJWTExpiring(this.currentToken)) {
      this.currentToken = generateKlingJWT(this.accessKey, this.secretKey);
      console.log('Generated new Kling AI JWT token (NEW SYSTEM):', {
        tokenPrefix: this.currentToken.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      });
    }
    
    return this.currentToken;
  }

  /**
   * Force refresh the JWT token
   */
  refreshToken(): string {
    this.currentToken = generateKlingJWT(this.accessKey, this.secretKey);
    console.log('Force refreshed Kling AI JWT token (NEW SYSTEM):', {
      tokenPrefix: this.currentToken.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
    return this.currentToken;
  }
} 