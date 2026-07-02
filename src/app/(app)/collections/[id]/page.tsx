"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCollectionStore } from "@/stores/collectionStore";
import { useSnackbar } from "notistack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const CollectionWorkspacePage = () => {
  const { id } = useParams();
  const {
    activeCollection,
    fetchCollection,
    fetchDocuments,
    isLoading,
    documents,
    uploadDocuments,
    deleteDocument,
  } = useCollectionStore();
  const { enqueueSnackbar } = useSnackbar();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );

  const handleUploadMoreDocuments = async (files: File[]) => {
    if (!id) return;

    if (files.length === 0) {
      enqueueSnackbar("Please select at least one file", { variant: "error" });
      return;
    }

    try {
      setIsUploading(true);
      await uploadDocuments(id as string, files);
      enqueueSnackbar("Documents uploaded successfully", {
        variant: "success",
      });
    } catch (error: unknown) {
      console.error("Error in uploading documents: ", error);
      enqueueSnackbar("Error in uploading documents", { variant: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id) return;

    try {
      setDeletingDocumentId(documentId);
      await deleteDocument(id as string, documentId);
      enqueueSnackbar("Document deleted successfully", { variant: "success" });
    } catch (error: unknown) {
      console.error("Error in deleting document: ", error);
      enqueueSnackbar("Failed to delete document", { variant: "error" });
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleUploadInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    void handleUploadMoreDocuments(files);
    event.target.value = "";
  };

  useEffect(() => {
    const loadCollectionData = async () => {
      if (!id) {
        enqueueSnackbar("Invalid collection ID", { variant: "error" });
        return;
      }
      const collectionId = id as string;
      try {
        await Promise.all([
          fetchCollection(collectionId),
          fetchDocuments(collectionId),
        ]);
      } catch (error: unknown) {
        enqueueSnackbar("Error in loading collection data", {
          variant: "error",
        });
        console.error("Error in loading collection data: ", error);
      }
    };
    loadCollectionData();
  }, [id, fetchCollection, fetchDocuments, enqueueSnackbar]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!activeCollection) {
    return <div>Collection not found</div>;
  }
  return (
    <main className="h-full bg-background p-6">
      <div className="flex gap-6 h-full">
        <aside className="w-full lg:w-[30%] rounded-lg border border-border bg-card p-4 space-y-4 overflow-y-auto min-h-0">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">
              {activeCollection.name}
            </h1>
            {activeCollection.description && (
              <p className="text-sm text-muted-foreground">
                {activeCollection.description}
              </p>
            )}
          </div>
          <Input
            id="upload-more-documents"
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={handleUploadInputChange}
            disabled={isUploading}
          />
          <Button
            type="button"
            disabled={isUploading}
            onClick={() =>
              document.getElementById("upload-more-documents")?.click()
            }
          >
            {isUploading ? "Uploading..." : "Add documents"}
          </Button>
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-foreground">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents yet.</p>
            ) : (
              documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between gap-2 rounded-lg p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {document.filename}
                  </span>
                  <Badge
                    className="h-7 rounded-lg px-2.5 text-[0.8rem]"
                    variant={
                      document.status === "ready"
                        ? "default"
                        : document.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {document.status}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => void handleDeleteDocument(document.id)}
                    disabled={
                      deletingDocumentId === document.id ||
                      document.status === "processing"
                    }
                  >
                    {deletingDocumentId === document.id
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>
              ))
            )}
          </div>
        </aside>
        <section className="flex min-h-0 w-full flex-col rounded-lg border border-border bg-card lg:w-[70%]">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <p className="text-sm text-muted-foreground">Chat UI coming next</p>
          </div>
          <div className="shrink-0 border-t border-border p-4">
            <p className="text-sm text-muted-foreground">Query input coming next</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CollectionWorkspacePage;
