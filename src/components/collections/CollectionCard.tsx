import { Folder } from "lucide-react";
import Link from "next/link";
import { Collection } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const CollectionCard = ({collection}: {
    collection: Collection;
}) => { 
  return (
    <Tooltip>
        <TooltipTrigger asChild>
            <Link href={`/collections/${collection.id}`}>
                <div className="flex flex-col items-center gap-2 p-4 w-24 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                    <Folder size={40} className="text-primary" />
                    <p className="text-xs text-foreground text-center truncate w-full">{collection.name}</p>
                </div>
            </Link>
        </TooltipTrigger>
        <TooltipContent>
            <p>{collection.description ?? ""}</p>
            <p>
                {new Date(collection.created_at).toLocaleDateString(
                    "en-US",
                    {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }
                )}
            </p>
        </TooltipContent>
    </Tooltip>
  )
}

export default CollectionCard