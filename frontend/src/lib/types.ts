export interface Message {
    role: 'user' | 'assistant';
    content: string;
    isThinking?: boolean;
}

export interface GenerateResponse {
    response: string;
}

export interface GenerateRequest {
    model: string;
    prompt: string;
    sessionId: string;
}
