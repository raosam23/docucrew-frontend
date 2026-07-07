"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useCollectionStore } from "@/stores/collectionStore";
import { useSnackbar } from "notistack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoadingState from "@/components/loading/LoadingState";
import ButtonLoader from "@/components/loading/ButtonLoader";
import QueryThinkingWord from "@/components/chat/QueryThinkingWord";

const CollectionWorkspacePage = () => {
  const { id } = useParams();
  const {
    activeCollection,
    isLoading,
    queryHistory,
    documents,
    isQuerying,
    fetchCollection,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    fetchQueryHistory,
    submitQuery,
  } = useCollectionStore();
  const { enqueueSnackbar } = useSnackbar();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(
    null,
  );
  const [queryInput, setQueryInput] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

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
          fetchQueryHistory(collectionId),
        ]);
      } catch (error: unknown) {
        enqueueSnackbar("Error in loading collection data", {
          variant: "error",
        });
        console.error("Error in loading collection data: ", error);
      }
    };
    loadCollectionData();
  }, [id, fetchCollection, fetchDocuments, enqueueSnackbar, fetchQueryHistory]);

  useEffect(() => {
    if (isLoading) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [queryHistory, isLoading]);

  if (isLoading) {
    return <LoadingState message="Loading collection data..." />;
  }

  if (!activeCollection) {
    return <div>Collection not found</div>;
  }

  const canQuery =
    documents.length > 0 && documents.every((doc) => doc.status === "ready");

  const handleSubmitQuery = async () => {
    if (!id) return;

    if (queryInput.trim() === "") {
      enqueueSnackbar("Please enter a question", { variant: "error" });
      return;
    }

    if (!canQuery) {
      enqueueSnackbar("All documents must be ready before querying", {
        variant: "error",
      });
      return;
    }
    try {
      await submitQuery(id as string, queryInput.trim());
      setQueryInput("");
      enqueueSnackbar("Query submitted", { variant: "success" });
    } catch (error: unknown) {
      console.error("Error in submitting query: ", error);
      enqueueSnackbar("Failed to submit query", { variant: "error" });
    }
  };
  const handleQueryKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!canQuery || isQuerying || queryInput.trim() === "") return;
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    void handleSubmitQuery();
  };
  return (
    <main className="h-full bg-background p-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to collections
      </Link>
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
            {isUploading ? <ButtonLoader /> : "Add documents"}
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
                    {deletingDocumentId === document.id ? (
                      <ButtonLoader size={16} />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </aside>
        <section className="flex min-h-0 w-full flex-col rounded-lg border border-border bg-card lg:w-[70%] h-full">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
            {queryHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet. Ask a question below.
              </p>
            ) : (
              queryHistory.map((query) => (
                <div className="space-y-4" key={query.id}>
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2 text-sm text-foreground">
                      {query.question}
                    </div>
                  </div>
                  <div className="w-full space-y-2">
                    <p className="text-sm text-foreground">{query.answer}</p>
                    {query.citations && query.citations.length > 0 && (
                      <details className="pt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                          Sources ({query.citations.length})
                        </summary>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {query.citations.map((citation, index) => (
                            <Badge
                              key={`${query.id}-citation-${index}`}
                              variant="outline"
                              className="h-7 rounded-lg px-2.5 text-[0.8rem] font-normal"
                            >
                              <span className="truncate max-w-48">
                                {citation.filename}
                              </span>
                              <span className="text-muted-foreground">
                                · chunk {citation.chunk_index + 1}
                              </span>
                              {citation.relevance_score != null && (
                                <span className="text-muted-foreground">
                                  · {Math.round(citation.relevance_score * 100)}
                                  %
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="shrink-0 border-t border-border p-4">
            {!canQuery && (
              <p className="mb-2 text-sm text-muted-foreground">
                {documents.length === 0
                  ? "No documents added yet"
                  : "Waiting for all documents to be ready."}
              </p>
            )}
            <div className="relative">
              <Textarea
                value={queryInput}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setQueryInput(event.target.value)
                }
                placeholder="Ask a question about your documents..."
                disabled={isQuerying || !canQuery}
                onKeyDown={handleQueryKeyDown}
                className="min-h-16 resize-none bg-background border-border pb-12 text-foreground"
              />
              <Button
                type="button"
                className="absolute bottom-3 right-3 w-44"
                disabled={!canQuery || isQuerying || queryInput.trim() === ""}
                onClick={() => void handleSubmitQuery()}
              >
                {isQuerying ? <QueryThinkingWord /> : "Submit Query"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CollectionWorkspacePage;
