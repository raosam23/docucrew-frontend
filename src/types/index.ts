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
    description?: string;
}