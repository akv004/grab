//! History storage for tracking recent captures
//!
//! Manages the list of recent captures and provides persistence.

use crate::error::{GrabError, GrabResult};
use crate::types::HistoryItem;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

const HISTORY_FILE: &str = "history.json";
const MAX_HISTORY_ITEMS: usize = 50;

/// History store for tracking recent captures
pub struct HistoryStore {
    items: Mutex<Vec<HistoryItem>>,
    file_path: PathBuf,
}

impl HistoryStore {
    /// Create a new history store
    pub fn new(app_handle: &AppHandle) -> GrabResult<Self> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| GrabError::Io(std::io::Error::new(std::io::ErrorKind::NotFound, e)))?;

        fs::create_dir_all(&app_data_dir)?;

        let file_path = app_data_dir.join(HISTORY_FILE);

        // Load existing history or create empty
        let items = if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
                Err(_) => Vec::new(),
            }
        } else {
            Vec::new()
        };

        Ok(HistoryStore {
            items: Mutex::new(items),
            file_path,
        })
    }

    /// Add a new item to history
    pub fn add(&self, file_path: String) -> GrabResult<()> {
        let item = HistoryItem {
            id: chrono::Utc::now().timestamp_millis().to_string(),
            file_path,
            timestamp: chrono::Utc::now().to_rfc3339(),
            thumbnail: None,
        };

        let mut items = self.items.lock().unwrap();

        // Add to beginning
        items.insert(0, item);

        // Limit size
        if items.len() > MAX_HISTORY_ITEMS {
            items.truncate(MAX_HISTORY_ITEMS);
        }

        drop(items);
        self.save()
    }

    /// Get all history items
    pub fn get_all(&self) -> Vec<HistoryItem> {
        let items = self.items.lock().unwrap();

        // Filter out files that no longer exist
        items
            .iter()
            .filter(|item| std::path::Path::new(&item.file_path).exists())
            .cloned()
            .collect()
    }

    /// Get the latest history item
    pub fn get_latest(&self) -> Option<HistoryItem> {
        self.get_all().into_iter().next()
    }

    /// Remove an item from history
    pub fn remove(&self, file_path: &str) -> GrabResult<bool> {
        let mut items = self.items.lock().unwrap();
        let initial_len = items.len();

        items.retain(|item| item.file_path != file_path);

        let removed = items.len() < initial_len;

        drop(items);

        if removed {
            self.save()?;
        }

        Ok(removed)
    }

    /// Scan a directory and add any images not already in history
    pub fn scan_directory(&self, directory: &PathBuf) -> GrabResult<usize> {
        if !directory.exists() {
            return Ok(0);
        }

        let entries = fs::read_dir(directory)?;
        let mut new_count = 0;

        let mut items = self.items.lock().unwrap();

        for entry in entries.flatten() {
            let path = entry.path();

            // Only process image files
            if let Some(ext) = path.extension() {
                let ext = ext.to_string_lossy().to_lowercase();
                if !["png", "jpg", "jpeg"].contains(&ext.as_str()) {
                    continue;
                }
            } else {
                continue;
            }

            let path_str = path.to_string_lossy().to_string();

            // Check if already in history
            if items.iter().any(|item| item.file_path == path_str) {
                continue;
            }

            // Get file metadata for timestamp
            let metadata = fs::metadata(&path)?;
            let timestamp = metadata
                .created()
                .or_else(|_| metadata.modified())
                .map(|t| {
                    chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339()
                })
                .unwrap_or_else(|_| chrono::Utc::now().to_rfc3339());

            let item = HistoryItem {
                id: format!(
                    "{}{}",
                    metadata
                        .created()
                        .map(|t| t
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap()
                            .as_millis())
                        .unwrap_or(0),
                    rand_suffix()
                ),
                file_path: path_str,
                timestamp,
                thumbnail: None,
            };

            items.push(item);
            new_count += 1;
        }

        // Sort by timestamp (newest first)
        items.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

        // Trim to max size
        if items.len() > MAX_HISTORY_ITEMS {
            items.truncate(MAX_HISTORY_ITEMS);
        }

        drop(items);

        if new_count > 0 {
            self.save()?;
        }

        Ok(new_count)
    }

    /// Save history to disk
    fn save(&self) -> GrabResult<()> {
        let items = self.items.lock().unwrap();
        let content = serde_json::to_string_pretty(&*items)?;
        fs::write(&self.file_path, content)?;
        Ok(())
    }
}

/// Generate a random suffix for unique IDs
fn rand_suffix() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    format!("{:05}", nanos % 100000)
}
