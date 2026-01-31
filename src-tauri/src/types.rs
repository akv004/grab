//! Shared types and data structures for Grab
//!
//! These types mirror the TypeScript types from the original Electron app.

use serde::{Deserialize, Serialize};

/// Supported capture modes
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum CaptureMode {
    FullScreen,
    Display,
    Window,
    Region,
}

impl Default for CaptureMode {
    fn default() -> Self {
        CaptureMode::FullScreen
    }
}

/// Region bounds for capture
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Request to initiate a capture
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureRequest {
    pub mode: CaptureMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region: Option<RegionBounds>,
    #[serde(default)]
    pub copy_to_clipboard: bool,
    #[serde(default = "default_true")]
    pub save_to_disk: bool,
}

fn default_true() -> bool {
    true
}

/// Metadata accompanying a capture result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureMetadata {
    pub mode: CaptureMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_id: Option<String>,
    pub bounds: RegionBounds,
    pub timestamp: String,
    pub scale_factor: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
}

/// Result of a capture operation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    pub metadata: CaptureMetadata,
    pub copied_to_clipboard: bool,
}

/// Display/source information for capture
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureSource {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_icon: Option<String>,
}

/// Keyboard shortcut configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortcutConfig {
    pub full_screen: String,
    pub region: String,
    pub window: String,
}

impl Default for ShortcutConfig {
    fn default() -> Self {
        ShortcutConfig {
            full_screen: "CommandOrControl+Shift+1".to_string(),
            region: "CommandOrControl+Shift+2".to_string(),
            window: "CommandOrControl+Shift+3".to_string(),
        }
    }
}

/// User preferences for capture behavior
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapturePreferences {
    pub output_folder: String,
    pub copy_to_clipboard: bool,
    pub save_to_disk: bool,
    pub default_mode: CaptureMode,
    pub naming_template: String,
    pub shortcuts: ShortcutConfig,
    #[serde(default)]
    pub open_editor_after_capture: bool,
    #[serde(default)]
    pub hide_editor_during_capture: bool,
    #[serde(default = "default_true")]
    pub show_notifications: bool,
}

impl Default for CapturePreferences {
    fn default() -> Self {
        CapturePreferences {
            output_folder: String::new(), // Will be set to default on init
            copy_to_clipboard: true,
            save_to_disk: true,
            default_mode: CaptureMode::FullScreen,
            naming_template: "grab-{date}-{time}-{mode}".to_string(),
            shortcuts: ShortcutConfig::default(),
            open_editor_after_capture: false,
            hide_editor_during_capture: false,
            show_notifications: true,
        }
    }
}

/// History item for tracking recent captures
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: String,
    pub file_path: String,
    pub timestamp: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
}

/// Capture error codes
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CaptureErrorCode {
    PermissionDenied,
    SourceNotFound,
    CaptureFailed,
    ExportFailed,
    ClipboardFailed,
    InvalidRequest,
    Cancelled,
}

/// Capture error with code and message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureError {
    pub code: CaptureErrorCode,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}
