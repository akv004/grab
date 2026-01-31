//! Tauri commands for the Grab application
//!
//! These commands are exposed to the frontend via Tauri's invoke system.

use crate::capture;
use crate::error::{GrabError, GrabResult};
use crate::history::HistoryStore;
use crate::preferences::PreferencesStore;
use crate::types::{
    CapturePreferences, CaptureResult, CaptureSource, HistoryItem, RegionBounds,
};
use base64::Engine;
use image::RgbaImage;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_shell::ShellExt;

// ============================================================================
// Capture Commands
// ============================================================================

/// Capture the full screen
#[tauri::command]
pub async fn capture_full_screen(
    display_id: Option<String>,
    app: AppHandle,
    prefs: State<'_, PreferencesStore>,
    history: State<'_, HistoryStore>,
) -> Result<CaptureResult, GrabError> {
    let (image, metadata) = match display_id {
        Some(id) => capture::capture_display(&id)?,
        None => capture::capture_full_screen()?,
    };
    let preferences = prefs.get();

    let result = save_and_process_capture(&app, &image, metadata, &preferences, &history).await?;

    Ok(result)
}

/// Capture a specific region
#[tauri::command]
pub async fn capture_region(
    app: AppHandle,
    region: RegionBounds,
    display_id: Option<String>,
    prefs: State<'_, PreferencesStore>,
    history: State<'_, HistoryStore>,
) -> Result<CaptureResult, GrabError> {
    let (image, metadata) = capture::capture_region(&region, display_id.as_deref())?;
    let preferences = prefs.get();

    let result = save_and_process_capture(&app, &image, metadata, &preferences, &history).await?;

    Ok(result)
}

/// Capture a specific window
#[tauri::command]
pub async fn capture_window(
    app: AppHandle,
    window_id: String,
    prefs: State<'_, PreferencesStore>,
    history: State<'_, HistoryStore>,
) -> Result<CaptureResult, GrabError> {
    let (image, metadata) = capture::capture_window(&window_id)?;
    let preferences = prefs.get();

    let result = save_and_process_capture(&app, &image, metadata, &preferences, &history).await?;

    Ok(result)
}

/// Get available screen sources
#[tauri::command]
pub fn get_screen_sources() -> Result<Vec<CaptureSource>, GrabError> {
    capture::get_screen_sources()
}

/// Get available window sources
#[tauri::command]
pub fn get_window_sources() -> Result<Vec<CaptureSource>, GrabError> {
    capture::get_window_sources()
}

// ============================================================================
// History Commands
// ============================================================================

/// Get all history items
#[tauri::command]
pub fn get_history(
    history: State<'_, HistoryStore>,
    prefs: State<'_, PreferencesStore>,
) -> Vec<HistoryItem> {
    // Scan directory first to pick up any new files
    let output_folder = prefs.get_output_folder();
    history.scan_directory(&output_folder).ok();

    history.get_all()
}

/// Remove an item from history
#[tauri::command]
pub fn remove_from_history(
    file_path: String,
    history: State<'_, HistoryStore>,
) -> Result<bool, GrabError> {
    history.remove(&file_path)
}

/// Scan a directory for new captures
#[tauri::command]
pub fn scan_directory(
    directory: String,
    history: State<'_, HistoryStore>,
) -> Result<usize, GrabError> {
    history.scan_directory(&PathBuf::from(directory))
}

// ============================================================================
// Preferences Commands
// ============================================================================

/// Get current preferences
#[tauri::command]
pub fn get_preferences(prefs: State<'_, PreferencesStore>) -> CapturePreferences {
    prefs.get()
}

/// Update preferences
#[tauri::command]
pub fn set_preferences(
    preferences: CapturePreferences,
    prefs: State<'_, PreferencesStore>,
) -> Result<(), GrabError> {
    prefs.set(preferences)
}

/// Get the output folder path
#[tauri::command]
pub fn get_output_folder(prefs: State<'_, PreferencesStore>) -> String {
    prefs.get_output_folder().to_string_lossy().to_string()
}

/// Browse for a folder (returns immediately, UI should handle folder selection)
#[tauri::command]
pub fn browse_folder(app: AppHandle) -> Result<Option<String>, GrabError> {
    use std::sync::mpsc;
    
    let (tx, rx) = mpsc::channel();
    
    app.dialog()
        .file()
        .set_title("Select Output Folder")
        .pick_folder(move |result| {
            let _ = tx.send(result.map(|p| p.to_string()));
        });
    
    // Wait for the result
    match rx.recv() {
        Ok(result) => Ok(result),
        Err(_) => Ok(None),
    }
}

// ============================================================================
// File Operation Commands
// ============================================================================

/// Save an image to a specific path
#[tauri::command]
pub fn save_image(
    data: String,
    default_path: Option<String>,
    app: AppHandle,
) -> Result<Option<String>, GrabError> {
    use std::sync::mpsc;
    
    let default_name = default_path.unwrap_or_else(|| "capture.png".to_string());

    let (tx, rx) = mpsc::channel();
    
    app.dialog()
        .file()
        .set_title("Save Image")
        .set_file_name(&default_name)
        .add_filter("Images", &["png", "jpg", "jpeg"])
        .save_file(move |result| {
            let _ = tx.send(result);
        });

    let file_path = match rx.recv() {
        Ok(Some(path)) => PathBuf::from(path.to_string()),
        _ => return Ok(None),
    };

    // Check if data is a file path or base64
    if data.starts_with("data:") {
        // Base64 data URL
        let base64_data = data
            .split(',')
            .nth(1)
            .ok_or_else(|| GrabError::InvalidRequest("Invalid data URL".to_string()))?;

        let bytes = base64::engine::general_purpose::STANDARD
            .decode(base64_data)
            .map_err(|e| GrabError::ExportFailed(e.to_string()))?;

        fs::write(&file_path, bytes)?;
    } else {
        // File path - copy the file
        fs::copy(&data, &file_path)?;
    }

    Ok(Some(file_path.to_string_lossy().to_string()))
}

/// Copy image to clipboard
#[tauri::command]
pub async fn copy_to_clipboard(data: String, app: AppHandle) -> Result<(), GrabError> {
    // Read image data
    let image_data = if data.starts_with("data:") {
        // Base64 data URL
        let base64_data = data
            .split(',')
            .nth(1)
            .ok_or_else(|| GrabError::InvalidRequest("Invalid data URL".to_string()))?;

        base64::engine::general_purpose::STANDARD
            .decode(base64_data)
            .map_err(|e| GrabError::ClipboardFailed(e.to_string()))?
    } else {
        // File path
        fs::read(&data).map_err(|e| GrabError::ClipboardFailed(e.to_string()))?
    };

    // Load image
    let img = image::load_from_memory(&image_data)
        .map_err(|e| GrabError::ClipboardFailed(e.to_string()))?;

    let rgba = img.to_rgba8();

    // Write to clipboard using Tauri plugin
    let clipboard_img = tauri::image::Image::new_owned(
        rgba.as_raw().clone(),
        rgba.width(),
        rgba.height(),
    );
    app.clipboard()
        .write_image(&clipboard_img)
        .map_err(|e| GrabError::ClipboardFailed(e.to_string()))?;

    Ok(())
}

/// Delete a screenshot (move to trash)
#[tauri::command]
pub async fn delete_screenshot(
    file_path: String,
    history: State<'_, HistoryStore>,
) -> Result<bool, GrabError> {
    // Try to move to trash
    let path = PathBuf::from(&file_path);

    if path.exists() {
        // Use trash crate if available, otherwise just delete
        #[cfg(feature = "trash")]
        {
            trash::delete(&path).map_err(|e| GrabError::ExportFailed(e.to_string()))?;
        }
        #[cfg(not(feature = "trash"))]
        {
            fs::remove_file(&path)?;
        }

        // Remove from history
        history.remove(&file_path)?;

        Ok(true)
    } else {
        Ok(false)
    }
}

/// Reveal a file in the system file manager
#[tauri::command]
pub async fn reveal_in_folder(file_path: String, app: AppHandle) -> Result<(), GrabError> {
    app.shell()
        .open(&file_path, None)
        .map_err(|e: tauri_plugin_shell::Error| GrabError::ExportFailed(e.to_string()))?;
    Ok(())
}

/// Export a capture (with options)
#[tauri::command]
pub fn export_capture(
    image_data: String,
    format: String,
    quality: Option<u8>,
    app: AppHandle,
) -> Result<Option<String>, GrabError> {
    use std::sync::mpsc;
    
    let ext = match format.as_str() {
        "jpeg" | "jpg" => "jpg",
        _ => "png",
    };

    let (tx, rx) = mpsc::channel();
    
    app.dialog()
        .file()
        .set_title("Export Capture")
        .set_file_name(&format!("capture.{}", ext))
        .add_filter("Images", &[ext])
        .save_file(move |result| {
            let _ = tx.send(result);
        });

    let file_path = match rx.recv() {
        Ok(Some(path)) => PathBuf::from(path.to_string()),
        _ => return Ok(None),
    };

    // Decode image data
    let bytes = if image_data.starts_with("data:") {
        let base64_data = image_data
            .split(',')
            .nth(1)
            .ok_or_else(|| GrabError::InvalidRequest("Invalid data URL".to_string()))?;

        base64::engine::general_purpose::STANDARD
            .decode(base64_data)
            .map_err(|e| GrabError::ExportFailed(e.to_string()))?
    } else {
        fs::read(&image_data)?
    };

    let img = image::load_from_memory(&bytes)
        .map_err(|e| GrabError::ExportFailed(e.to_string()))?;

    // Save with appropriate format
    match format.as_str() {
        "jpeg" | "jpg" => {
            let _quality = quality.unwrap_or(90);
            img.save_with_format(&file_path, image::ImageFormat::Jpeg)
                .map_err(|e| GrabError::ExportFailed(e.to_string()))?;
        }
        _ => {
            img.save_with_format(&file_path, image::ImageFormat::Png)
                .map_err(|e| GrabError::ExportFailed(e.to_string()))?;
        }
    }

    Ok(Some(file_path.to_string_lossy().to_string()))
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

/// Save capture and process (clipboard, notifications, etc.)
async fn save_and_process_capture(
    app: &AppHandle,
    image: &RgbaImage,
    mut metadata: crate::types::CaptureMetadata,
    preferences: &CapturePreferences,
    history: &State<'_, HistoryStore>,
) -> GrabResult<CaptureResult> {
    let mut file_path: Option<String> = None;
    let mut copied_to_clipboard = false;

    // Save to disk if enabled
    if preferences.save_to_disk {
        let output_folder = PathBuf::from(&preferences.output_folder);

        // Create output folder if it doesn't exist
        fs::create_dir_all(&output_folder)?;

        // Generate filename
        let filename = capture::generate_filename(&preferences.naming_template, metadata.mode);
        let full_path = output_folder.join(format!("{}.png", filename));

        // Save image
        capture::save_image(image, &full_path)?;

        let path_str = full_path.to_string_lossy().to_string();
        metadata.file_name = Some(filename);
        file_path = Some(path_str.clone());

        // Add to history
        history.add(path_str)?;
    }

    // Copy to clipboard if enabled
    if preferences.copy_to_clipboard {
        let clipboard_img = tauri::image::Image::new_owned(
            image.as_raw().clone(),
            image.width(),
            image.height(),
        );
        app.clipboard()
            .write_image(&clipboard_img)
            .map_err(|e| GrabError::ClipboardFailed(e.to_string()))?;

        copied_to_clipboard = true;
    }

    // Show notification if enabled
    if preferences.show_notifications {
        let mut message = String::new();

        if let Some(ref path) = file_path {
            let filename = PathBuf::from(path)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            message = format!("Saved to {}", filename);
        }

        if copied_to_clipboard {
            if !message.is_empty() {
                message.push_str(" and clipboard");
            } else {
                message = "Copied to clipboard".to_string();
            }
        }

        app.notification()
            .builder()
            .title("Capture Complete")
            .body(&message)
            .show()
            .ok();
    }

    // Always refresh history in UI after capture
    if let Some(window) = app.get_webview_window("main") {
        window.emit("history:refresh", ()).ok();
        
        // Open editor if enabled
        if preferences.open_editor_after_capture {
            window.show().ok();
            window.set_focus().ok();

            if let Some(ref path) = file_path {
                window.emit("show-capture", path).ok();
            }
        }
    }

    Ok(CaptureResult {
        file_path,
        metadata,
        copied_to_clipboard,
    })
}

/// Trigger full screen capture (called from shortcuts/tray)
pub async fn trigger_capture_full_screen(app: &AppHandle) -> GrabResult<()> {
    let prefs = app.state::<PreferencesStore>();
    let history = app.state::<HistoryStore>();

    let (image, metadata) = capture::capture_full_screen()?;
    let preferences = prefs.get();

    save_and_process_capture(app, &image, metadata, &preferences, &history).await?;

    Ok(())
}

/// Trigger window capture (called from shortcuts/tray)
pub async fn trigger_capture_window(app: &AppHandle) -> GrabResult<()> {
    // For window capture, we need user to select a window
    // This will be handled by the frontend showing a window picker
    if let Some(window) = app.get_webview_window("main") {
        window.emit("show-window-picker", ()).ok();
    }

    Ok(())
}

/// Trigger capture of a specific display (called from tray submenu)
pub async fn trigger_capture_display(app: &AppHandle, display_id: &str) -> GrabResult<()> {
    let prefs = app.state::<PreferencesStore>();
    let history = app.state::<HistoryStore>();

    let (image, metadata) = capture::capture_display(display_id)?;
    let preferences = prefs.get();

    save_and_process_capture(app, &image, metadata, &preferences, &history).await?;

    Ok(())
}
