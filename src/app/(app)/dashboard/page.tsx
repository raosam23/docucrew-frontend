"use client";
import { useCollectionStore } from "@/stores/collectionStore";
import { useEffect } from "react";
import CollectionCard from "@/components/collections/CollectionCard";
import { Collection } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { collections, isLoading, fetchCollections } = useCollectionStore();
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);
  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">Loading...</div>;
  return (
    <main className="min-h-screen bg-background px-10 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">My Collections</h1>
          <p className="text-base text-muted-foreground">Your documents collections</p>
        </div>
        <Link href="/collections/new">
          <Button variant="default">New Collection</Button>
        </Link>
      </div>
      {/* Empty State */}
      {!isLoading && collections.length === 0 && (
        <div className="flex items-center justify-center py-24 text-center">
          <p className="text-muted-foreground text-base">No collections yet. Please create a new collection to get started.</p>
        </div>
      )}
      {/* Grid of Collections */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
        {collections.map(collection => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </main>
  );
};

export default DashboardPage;
