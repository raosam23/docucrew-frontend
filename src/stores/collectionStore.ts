import { create } from "zustand";
import { Collection, CreateCollectionPayload, DocRecord } from "@/types";
import api from "@/lib/api";
import { QueryHistoryItem } from "@/types";
import { QueryResponse } from "@/types";

type CollectionState = {
  collections: Collection[];
  isLoading: boolean;
  documents: DocRecord[];
  activeCollection: Collection | null;
  queryHistory: QueryHistoryItem[];
  isQuerying: boolean;
  fetchCollection: (collectionId: string) => Promise<void>;
  fetchCollections: () => Promise<void>;
  createCollection: (payload: CreateCollectionPayload) => Promise<Collection>;
  fetchDocuments: (collectionId: string) => Promise<void>;
  uploadDocuments: (
    collectionId: string,
    files: File[],
  ) => Promise<DocRecord[]>;
  deleteDocument: (collectionId: string, documentId: string) => Promise<void>;
  fetchQueryHistory: (collectionId: string) => Promise<void>;
  submitQuery: (
    collectionId: string,
    question: string,
  ) => Promise<QueryResponse>;
};

export const useCollectionStore = create<CollectionState>()((set) => ({
  collections: [],
  isLoading: false,
  documents: [],
  activeCollection: null,
  queryHistory: [],
  isQuerying: false,
  fetchCollection: async (collectionId: string) => {
    try {
      set({ isLoading: true });
      const collection: Collection = await api
        .get(`api/collections/${collectionId}`)
        .json<Collection>();
      set({ activeCollection: collection });
    } catch (error: unknown) {
      console.error("Error fetching collection: ", error);
      throw error as Error;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchCollections: async () => {
    try {
      set({ isLoading: true });
      const collections: Collection[] = await api
        .get("api/collections/")
        .json<Collection[]>();
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
      const collection: Collection = await api
        .post("api/collections/", {
          json: {
            name: payload.name,
            description: payload.description,
          },
        })
        .json<Collection>();

      set((state) => ({
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
      const documents: DocRecord[] = await api
        .get(`api/collections/${collectionId}/documents`)
        .json<DocRecord[]>();
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
      files.forEach((file) => formData.append("files", file));

      const uploaded: DocRecord[] = await api
        .post(`api/collections/${collectionId}/documents/`, {
          body: formData,
          timeout: false,
        })
        .json<DocRecord[]>();
      set((state) => ({ documents: [...state.documents, ...uploaded] }));
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
      await api.delete(
        `api/collections/${collectionId}/documents/${documentId}`,
      );
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== documentId),
      }));
    } catch (error: unknown) {
      console.error("Error deleting document: ", error);
      throw error as Error;
    } finally {
      set({ isLoading: false });
    }
  },
  fetchQueryHistory: async (collectionId: string) => {
    try {
      set({ isLoading: true });
      const queryHistory: QueryHistoryItem[] = await api
        .get(`api/collections/${collectionId}/history`)
        .json<QueryHistoryItem[]>();
      set({ queryHistory });
    } catch (error: unknown) {
      console.error("Error fetching query history: ", error);
      throw error as Error;
    } finally {
      set({ isLoading: false });
    }
  },
  submitQuery: async (collectionId: string, question: string) => {
    try {
      set({ isQuerying: true });
      const response: QueryResponse = await api
        .post(`api/collections/${collectionId}/query`, {
          json: {
            question
          },
          timeout: false,
        })
        .json<QueryResponse>();
      set((state) => ({
        queryHistory: [
          ...state.queryHistory,
          {
            id: response.query_id,
            question,
            answer: response.answer,
            citations: response.citations,
            created_at: new Date().toISOString(),
          },
        ],
      }));
      return response;
    } catch (error: unknown) {
      console.error("Error submitting query: ", error);
      throw error as Error;
    } finally {
      set({ isQuerying: false });
    }
  },
}));
