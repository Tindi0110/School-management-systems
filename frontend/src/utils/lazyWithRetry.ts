import React from 'react';

/**
 * A wrapper for React.lazy that handles chunk load failures.
 * This is common when a new version of the app is deployed and the 
 * user's browser is still trying to fetch old hashed asset files.
 */
export const lazyWithRetry = (componentImport: () => Promise<any>) =>
    React.lazy(async () => {
        try {
            return await componentImport();
        } catch (error: any) {
            console.error('Lazy load failed:', error);

            // Check if it's a module load error
            // Vite/Rollup usually throws "Failed to fetch dynamically imported module"
            // The user's error: "error loading dynamically imported module"
            const isChunkLoadError =
                error.message?.includes('loading dynamically imported module') ||
                error.message?.includes('Failed to fetch dynamically imported module');

            if (isChunkLoadError) {
                console.warn('Chunk load error detected. Forcing page refresh to fetch latest build...');
                window.location.reload();
            }

            throw error;
        }
    });
