import { create } from "zustand";
import { Collection } from "@/types";
import api from "@/lib/api";

type CollectionState = {
    collections: Collection[];
    isLoading: boolean;
    fetchCollections: () => Promise<void>;
};

export const useCollectionStore = create<CollectionState>()(set => ({
    collections: [],
    isLoading: false,
    fetchCollections: async () => {
        try {
            set({ isLoading: true });
            const collections: Collection[] = await api.get("api/collections").json<Collection[]>();
            set({ collections });
        } catch (error: unknown) {
            console.error("Error fetching collections:", error);
            throw error as Error;
        } finally {
            set({ isLoading: false });
        }
    },
}));