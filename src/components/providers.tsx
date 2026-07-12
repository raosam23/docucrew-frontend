"use client";
import React from "react";

import { SnackbarProvider } from "notistack";

import { TooltipProvider } from "./ui/tooltip";

export default function Providers({children}: {
    children: React.ReactNode;
}) {
    return (
        <SnackbarProvider maxSnack={3}>
            <TooltipProvider>
                {children}
            </TooltipProvider>
        </SnackbarProvider>
    )
}