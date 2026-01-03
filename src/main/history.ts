/**
 * History store for tracking recent captures
 * @module main/history
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { captureLogger } from '../shared/logger';

const HISTORY_FILE = 'history.json';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
    id: string;
    filePath: string;
    timestamp: string;
    thumbnail?: string; // Data URL for future optimization
}

class HistoryStore {
    private items: HistoryItem[] = [];
    private filePath: string;

    constructor() {
        this.filePath = path.join(app.getPath('userData'), HISTORY_FILE);
        this.items = this.load();
    }

    private load(): HistoryItem[] {
        try {
            if (fs.existsSync(this.filePath)) {
                const data = fs.readFileSync(this.filePath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            captureLogger.error('Failed to load history', { error });
        }
        return [];
    }

    private save(): void {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf-8');
        } catch (error) {
            captureLogger.error('Failed to save history', { error });
        }
    }

    add(filePath: string): void {
        const item: HistoryItem = {
            id: Date.now().toString(),
            filePath,
            timestamp: new Date().toISOString(),
        };

        // Add to beginning, limit size
        this.items.unshift(item);
        if (this.items.length > MAX_HISTORY_ITEMS) {
            this.items = this.items.slice(0, MAX_HISTORY_ITEMS);
        }

        this.save();
    }

    scanDirectory(directoryPath: string): void {
        try {
            if (!fs.existsSync(directoryPath)) return;

            const files = fs.readdirSync(directoryPath);
            // Filter for image files
            const images = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

            let newItemsCount = 0;

            images.forEach(file => {
                const fullPath = path.join(directoryPath, file);

                // check if already in history
                const exists = this.items.some(item => item.filePath === fullPath);
                if (!exists) {
                    const stats = fs.statSync(fullPath);
                    this.items.push({
                        id: stats.birthtimeMs.toString() + Math.random().toString().substr(2, 5),
                        filePath: fullPath,
                        timestamp: stats.birthtime.toISOString()
                    });
                    newItemsCount++;
                }
            });

            // Sort by date new to old
            this.items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // Trim
            if (this.items.length > MAX_HISTORY_ITEMS) {
                this.items = this.items.slice(0, MAX_HISTORY_ITEMS);
            }

            if (newItemsCount > 0) {
                captureLogger.info(`Scanned ${newItemsCount} new items from ${directoryPath}`);
                this.save();
            }
        } catch (error) {
            captureLogger.error('Failed to scan directory', { error });
        }
    }

    getAll(): HistoryItem[] {
        // Filter out files that no longer exist
        return this.items.filter(item => fs.existsSync(item.filePath));
    }

    getLatest(): HistoryItem | null {
        const all = this.getAll();
        return all.length > 0 ? all[0] : null;
    }

    scanFromDirectory(directoryPath: string): void {
        // Implementation for scanning a directory and adding items to history
        // This is a placeholder for the actual logic.
        // For example, it might read files from the directory, create HistoryItem objects,
        // and add them using this.add() or directly manipulate this.items and then save().
        captureLogger.info(`Scanning directory: ${directoryPath}`);
        // Example:
        // const files = fs.readdirSync(directoryPath);
        // files.forEach(file => {
        //     const filePath = path.join(directoryPath, file);
        //     if (fs.statSync(filePath).isFile()) {
        //         this.add(filePath); // This would add to the beginning and save
        //     }
        // });
        // If adding many, consider batching and saving once.
    }
}

// Singleton
let instance: HistoryStore | null = null;

export function getHistoryStore(): HistoryStore {
    if (!instance) {
        instance = new HistoryStore();
    }
    return instance;
}

export { HistoryStore };
