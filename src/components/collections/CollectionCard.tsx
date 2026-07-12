"use client";
import { useState } from "react";
import Link from "next/link";

import { Folder, Trash2 } from "lucide-react";
import { useSnackbar } from "notistack";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCollectionStore } from "@/stores/collectionStore";
import { Collection } from "@/types";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const CollectionCard = ({ collection }: { collection: Collection }) => {
  const { deleteCollection } = useCollectionStore();
  const { enqueueSnackbar } = useSnackbar();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handleConfirmDelete = async () => {
    try {
      await deleteCollection(collection.id);
      enqueueSnackbar("Collection deleted successfully", {
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error deleting collection: ", error);
      enqueueSnackbar("Failed to delete collection", { variant: "error" });
    }
  };
  return (
    <div className="relative w-24">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/collections/${collection.id}`}>
            <div className="flex flex-col items-center gap-2 p-4 w-24 rounded-lg cursor-pointer hover:bg-muted transition-colors">
              <Folder size={40} className="text-primary" />
              <p className="text-xs text-foreground text-center truncate w-full">
                {collection.name}
              </p>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{collection.description ?? ""}</p>
          <p>
            {new Date(collection.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </TooltipContent>
      </Tooltip>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute -top-2 -right-2 size-7 rounded-lg p-0"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDeleteDialogOpen(true);
        }}
        aria-label={`Delete ${collection.name}`}
      >
        <Trash2 className="size-3.5" />
      </Button>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{collection.name}&quot; and all associated documents?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollectionCard;
