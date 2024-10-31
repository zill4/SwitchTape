export interface RetryConfig {
    maxAttempts: number;
    delayMs: number;
    backoffFactor: number;
}

export class ResponseHandler {
    private static defaultRetryConfig: RetryConfig = {
        maxAttempts: 3,
        delayMs: 1000,
        backoffFactor: 2
    };

    static async handleResponse<T>(
        requestFn: () => Promise<Response>,
        retryConfig: Partial<RetryConfig> = {}
    ): Promise<T> {
        const config = { ...this.defaultRetryConfig, ...retryConfig };
        let attempts = 0;
        let delay = config.delayMs;

        while (attempts < config.maxAttempts) {
            try {
                const response = await requestFn();
                
                if (response.ok) {
                    return await response.json();
                }

                if (response.status === 401) {
                    if (attempts === config.maxAttempts - 1) {
                        throw new Error('Max authentication retry attempts reached');
                    }
                    // Clear tokens before retry
                    localStorage.removeItem('spotify_access_token');
                    localStorage.removeItem('spotify_token_expiry');
                } else if (response.status === 429) {
                    // Rate limit hit - get retry delay from headers
                    const retryAfter = response.headers.get('Retry-After');
                    if (retryAfter) {
                        delay = parseInt(retryAfter) * 1000;
                    }
                } else {
                    // Don't retry other status codes
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= config.backoffFactor;
                attempts++;
                
            } catch (error) {
                if (attempts === config.maxAttempts - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= config.backoffFactor;
                attempts++;
            }
        }

        throw new Error('Max retry attempts reached');
    }

    static async retryWithNewToken<T>(
        requestFn: (token: string) => Promise<T>,
        getNewToken: () => Promise<string>
    ): Promise<T> {
        try {
            const token = await getNewToken();
            const response = await requestFn(token);
            return response;
        } catch (error) {
            // If token is expired or invalid, try one more time with a new token
            if (error instanceof Error && error.message.includes('token')) {
                const newToken = await getNewToken();
                return await requestFn(newToken);
            }
            throw error;
        }
    }
}