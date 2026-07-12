export type User = {
    id: string;
    email: string;
    name: string | null;
    created_at: string;
};

export type Collection = {
    id: string;
    name: string;
    description: string | null;
    chroma_collection_id: string;
    created_at: string;
};

export type FileType = "pdf" | "docx" | "txt" | "md";
export type DocumentStatus = "pending" | "processing" | "ready" | "failed";

export type DocRecord = {
    id: string;
    collection_id: string;
    filename: string;
    file_type: FileType;
    status: DocumentStatus;
    chunk_count: number | null;
    error_message: string | null;
    created_at: string;
};

export type CreateCollectionPayload = {
    name: string;
    description?: string | null;
};

export enum StreamingPhase {
    IDLE = "IDLE",
    THINKING = "THINKING",
    STREAMING = "STREAMING",
}

export type Citation = {
    filename: string;
    chunk_index: number;
    relevance_score?: number | null;
}

export type QueryResponse = {
    answer: string;
    citations?: Citation[];
    query_id: string;
}

export type QueryHistoryItem = {
    id: string;
    question: string;
    answer: string;
    citations?: Citation[];
    created_at: string;
}

export type StreamStatusEvent = {
    message: string;
}

export type StreamTokenEvent = {
    content: string;
}

export type StreamDoneEvent = {
    query_id: string;
    answer: string;
    citations: Citation[];
    created_at: string;
}

export type StreamErrorEvent = {
    message: string;
}