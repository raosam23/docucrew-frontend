"use client";
import { useCollectionStore } from '@/stores/collectionStore';
import { enqueueSnackbar } from 'notistack';
import React, { useState} from 'react'
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

const NewCollectionPage = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("")
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { createCollection, uploadDocuments } = useCollectionStore();
  const router = useRouter();
  const handleCreateCollection = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(name.trim() === "") {
        enqueueSnackbar("Name is required", { variant: "error" });
        return;
    }
    if(files.length === 0) {
        enqueueSnackbar("At least one file is required", { variant: "error" });
        return;
    }
    try {
        setIsSubmitting(true);
        const collection = await createCollection({ name, description });
        await uploadDocuments(collection.id, files);
        enqueueSnackbar("Collection created successfully", { variant: "success" });
        router.push(`/collections/${collection.id}`);
    } catch (error: unknown) {
        console.error("Error creating collection: ", error);
        enqueueSnackbar("Failed to create collection", { variant: "error" });
    } finally {
        setIsSubmitting(false);
    }
  }
    return (
    <div className="min-h-screen bg-background px-6 py-10">
        <div className="mx-auto mb-8 w-full max-w-2xl space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-foreground">New Collection</h1>
            <p className="text-base text-muted-foreground">Create a collection and upload your documents</p>
        </div>
        <form className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-card p-6 space-y-4" onSubmit={handleCreateCollection}>
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
                    required
                    placeholder="Name"
                    className="bg-background border-border text-foreground"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)}
                    placeholder="Description"
                    rows={4}
                    className="resize-none bg-background border-border text-foreground"
                />
            </div>
            <div>
                <Label htmlFor="files">Files</Label>
                <Input
                    id="files"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.md"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setFiles(Array.from(event.target.files ?? []))
                    }
                    className="bg-background border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">Accepted: .pdf, .docx, .txt, .md (max 10MB each)</p>
            </div>
            <div className='pt-2'>
                <Button className="w-full sm:w-auto" variant="default" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating collection..." : "Create collection"}
                </Button>
            </div>
        </form>
    </div>
  )
}

export default NewCollectionPage