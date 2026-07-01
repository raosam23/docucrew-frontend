import { create } from "zustand";
import { Collection, CreateCollectionPayload, DocRecord } from "@/types";
import api from "@/lib/api";

type CollectionState = {
    collections: Collection[];
    isLoading: boolean;
    documents: DocRecord[];
    fetchCollections: () => Promise<void>;
    createCollection: (payload: CreateCollectionPayload) => Promise<Collection>;
    fetchDocuments: (collectionId: string) => Promise<void>;
    uploadDocuments: (collectionId: string, files: File[]) => Promise<DocRecord[]>;
    deleteDocument: (collectionId: string, documentId: string) => Promise<void>;
};

export const useCollectionStore = create<CollectionState>()(set => ({
    collections: [],
    isLoading: false,
    documents: [],
    fetchCollections: async () => {
        try {
            set({ isLoading: true });
            const collections: Collection[] = await api.get("api/collections/").json<Collection[]>();
            set({ collections });
        } catch (error: unknown) {
            console.error("Error fetching collections:", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    },
    createCollection: async (payload: CreateCollectionPayload) => {
        try {
            set({ isLoading: true });
            const collection: Collection = await api.post("api/collections/", {
                json : {
                    name: payload.name,
                    description: payload.description,
                }
            }).json<Collection>();

            set(state => ({
                collections: [...state.collections, collection],
            }));
            return collection;
        } catch (error: unknown) {
            console.error("Error creating collection: ", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    },
    fetchDocuments: async (collectionId: string) => {
        try {
            set({ isLoading: true });
            const documents: DocRecord[] = await api.get(`api/collections/${collectionId}/documents`).json<DocRecord[]>();
            set({ documents });
        } catch (error: unknown) {
            console.error("Error fetching documents: ", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    },
    uploadDocuments: async (collectionId: string, files: File[]) => {
        try {
            set({ isLoading: true });

            const formData = new FormData();
            files.forEach(file => formData.append("files", file));

            const uploaded: DocRecord[] = await api.post(`api/collections/${collectionId}/documents/`, {body: formData, timeout: false,}).json<DocRecord[]>();
            set((state) => ({documents: [...state.documents, ...uploaded]}));
            return uploaded;
        } catch (error: unknown) {
            console.error("Error uploading documents: ", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    },
    deleteDocument: async (collectionId: string, documentId: string) => {
        try {
            set({ isLoading: true });
            await api.delete(`api/collections/${collectionId}/documents/${documentId}`);
            set(state => ({
                documents: state.documents.filter(doc => doc.id !== documentId),
            }))
        } catch (error: unknown) {
            console.error("Error deleting document: ", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    }
}));