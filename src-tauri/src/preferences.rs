//! Preferences storage and management
//!
//! Handles loading, saving, and managing user preferences.

use crate::error::{GrabError, GrabResult};
use crate::types::CapturePreferences;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

const PREFERENCES_FILE: &str = "preferences.json";

/// Preferences store for managing user settings
pub struct PreferencesStore {
    preferences: Mutex<CapturePreferences>,
    file_path: PathBuf,
}

impl PreferencesStore {
    /// Create a new preferences store
    pub fn new(app_handle: &AppHandle) -> GrabResult<Self> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| GrabError::Io(std::io::Error::new(std::io::ErrorKind::NotFound, e)))?;

        // Create app data directory if it doesn't exist
        fs::create_dir_all(&app_data_dir)?;

        let file_path = app_data_dir.join(PREFERENCES_FILE);

        // Load existing preferences or create defaults
        let preferences = if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| {
                    let mut prefs = CapturePreferences::default();
                    prefs.output_folder = get_default_output_folder();
                    prefs
                }),
                Err(_) => {
                    let mut prefs = CapturePreferences::default();
                    prefs.output_folder = get_default_output_folder();
                    prefs
                }
            }
        } else {
            let mut prefs = CapturePreferences::default();
            prefs.output_folder = get_default_output_folder();
            prefs
        };

        let store = PreferencesStore {
            preferences: Mutex::new(preferences),
            file_path,
        };

        // Save to ensure file exists
        store.save()?;

        Ok(store)
    }

    /// Get current preferences
    pub fn get(&self) -> CapturePreferences {
        self.preferences.lock().unwrap().clone()
    }

    /// Update preferences
    pub fn set(&self, preferences: CapturePreferences) -> GrabResult<()> {
        let mut prefs = self.preferences.lock().unwrap();
        *prefs = preferences;
        drop(prefs);
        self.save()
    }

    /// Save preferences to disk
    fn save(&self) -> GrabResult<()> {
        let prefs = self.preferences.lock().unwrap();
        let content = serde_json::to_string_pretty(&*prefs)?;
        fs::write(&self.file_path, content)?;
        Ok(())
    }

    /// Get the output folder path
    pub fn get_output_folder(&self) -> PathBuf {
        let prefs = self.preferences.lock().unwrap();
        if prefs.output_folder.is_empty() {
            PathBuf::from(get_default_output_folder())
        } else {
            PathBuf::from(&prefs.output_folder)
        }
    }
}

/// Get the default output folder for captures
pub fn get_default_output_folder() -> String {
    dirs::picture_dir()
        .or_else(dirs::home_dir)
        .map(|p| p.join("Grab Captures"))
        .unwrap_or_else(|| PathBuf::from("./captures"))
        .to_string_lossy()
        .to_string()
}
