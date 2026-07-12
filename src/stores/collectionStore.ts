import { create } from "zustand";

import api from "@/lib/api";
import { Collection, CreateCollectionPayload, DocRecord, StreamDoneEvent, StreamingPhase } from "@/types";
import { QueryHistoryItem } from "@/types";
import { QueryResponse } from "@/types";

type CollectionState = {
  collections: Collection[];
  isLoading: boolean;
  documents: DocRecord[];
  activeCollection: Collection | null;
  queryHistory: QueryHistoryItem[];
  isQuerying: boolean;
  streamingPhase: StreamingPhase
  fetchCollection: (collectionId: string) => Promise<void>;
  fetchCollections: () => Promise<void>;
  createCollection: (payload: CreateCollectionPayload) => Promise<Collection>;
  deleteCollection: (collectionId: string) => Promise<void>;
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
  submitQueryStream: (
    collectionId: string,
    question: string,
  ) => Promise<StreamDoneEvent>;
};

export const useCollectionStore = create<CollectionState>()((set) => ({
  collections: [],
  isLoading: false,
  documents: [],
  activeCollection: null,
  queryHistory: [],
  isQuerying: false,
  streamingPhase: StreamingPhase.IDLE,
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
  deleteCollection: async (collectionId: string) => {
    try {
      set({ isLoading: true });
      await api.delete(`api/collections/${collectionId}`);
      set((state) => {
        const collections = state.collections.filter(
          (collection) => collection.id !== collectionId,
        );
        if (state.activeCollection?.id === collectionId) {
          return {
            collections,
            activeCollection: null,
            documents: [],
            queryHistory: [],
          };
        }
        return { collections };
      });
    } catch (error: unknown) {
      console.error("Error deleting collection: ", error);
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
  submitQueryStream: async (collectionId: string, question: string) => {
    try {
      set({ isQuerying: true });
      set({ streamingPhase: StreamingPhase.THINKING});
      const pendingID = crypto.randomUUID();
      set((state) => ({
        queryHistory: [
          ...state.queryHistory,
          {
            id: pendingID,
            question,
            answer: "",
            citations: [],
            created_at: new Date().toISOString(),
          }
        ]
      }))
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/query/stream`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ question }),
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }
      if (!response.body) {
        throw new Error("No response body");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let donePayload: StreamDoneEvent | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          let eventName = "message";
          let dataLine = "";
          for (const line of part.split("\n")) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            }
            if (line.startsWith("data:")) {
              dataLine = line.slice(5).trim();
            }
          }
          if (!dataLine) continue;

          const data = JSON.parse(dataLine);

          if (eventName === "token") {
            set((state) => ({
              streamingPhase: StreamingPhase.STREAMING,
              queryHistory: state.queryHistory.map((item) =>
                item.id === pendingID
                  ? { ...item, answer: item.answer + data.content }
                  : item,
              ),
            }));
          }
          if (eventName === "done") {
            donePayload = data as StreamDoneEvent;
            set((state) => ({
              queryHistory: state.queryHistory.map((item) =>
                item.id === pendingID
                  ? {
                      id: data.query_id,
                      question,
                      answer: data.answer,
                      citations: data.citations,
                      created_at: data.created_at,
                    }
                  : item,
              ),
            }));
          }
          if (eventName === "error") {
            throw new Error(data.message);
          }
        }
      }
      if (!donePayload) {
        throw new Error("Stream ended without a done event");
      }
      return donePayload;
    } catch (error: unknown) {
      console.error("Error submitting query stream: ", error);
      throw error as Error;
    } finally {
      set(
        {
          isQuerying: false,
          streamingPhase: StreamingPhase.IDLE,
        }
      );
    }
  },
}));
