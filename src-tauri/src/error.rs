//! Error handling for Grab
//!
//! Custom error types and Result aliases for the application.

use crate::types::CaptureErrorCode;
use serde::Serialize;
use thiserror::Error;

/// Application error type
#[derive(Debug, Error)]
pub enum GrabError {
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Source not found: {0}")]
    SourceNotFound(String),

    #[error("Capture failed: {0}")]
    CaptureFailed(String),

    #[error("Export failed: {0}")]
    ExportFailed(String),

    #[error("Clipboard operation failed: {0}")]
    ClipboardFailed(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Operation cancelled")]
    Cancelled,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Tauri error: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("Image error: {0}")]
    Image(#[from] image::ImageError),
}

impl GrabError {
    /// Get the error code for this error
    pub fn code(&self) -> CaptureErrorCode {
        match self {
            GrabError::PermissionDenied(_) => CaptureErrorCode::PermissionDenied,
            GrabError::SourceNotFound(_) => CaptureErrorCode::SourceNotFound,
            GrabError::CaptureFailed(_) => CaptureErrorCode::CaptureFailed,
            GrabError::ExportFailed(_) => CaptureErrorCode::ExportFailed,
            GrabError::ClipboardFailed(_) => CaptureErrorCode::ClipboardFailed,
            GrabError::InvalidRequest(_) => CaptureErrorCode::InvalidRequest,
            GrabError::Cancelled => CaptureErrorCode::Cancelled,
            GrabError::Io(_) => CaptureErrorCode::ExportFailed,
            GrabError::Serialization(_) => CaptureErrorCode::ExportFailed,
            GrabError::Tauri(_) => CaptureErrorCode::CaptureFailed,
            GrabError::Image(_) => CaptureErrorCode::CaptureFailed,
        }
    }
}

/// Serializable error for frontend
#[derive(Debug, Serialize)]
pub struct SerializableError {
    pub code: CaptureErrorCode,
    pub message: String,
}

impl From<GrabError> for SerializableError {
    fn from(err: GrabError) -> Self {
        SerializableError {
            code: err.code(),
            message: err.to_string(),
        }
    }
}

impl Serialize for GrabError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let serializable = SerializableError::from(self.clone());
        serializable.serialize(serializer)
    }
}

impl Clone for GrabError {
    fn clone(&self) -> Self {
        match self {
            GrabError::PermissionDenied(s) => GrabError::PermissionDenied(s.clone()),
            GrabError::SourceNotFound(s) => GrabError::SourceNotFound(s.clone()),
            GrabError::CaptureFailed(s) => GrabError::CaptureFailed(s.clone()),
            GrabError::ExportFailed(s) => GrabError::ExportFailed(s.clone()),
            GrabError::ClipboardFailed(s) => GrabError::ClipboardFailed(s.clone()),
            GrabError::InvalidRequest(s) => GrabError::InvalidRequest(s.clone()),
            GrabError::Cancelled => GrabError::Cancelled,
            GrabError::Io(e) => GrabError::Io(std::io::Error::new(e.kind(), e.to_string())),
            GrabError::Serialization(e) => {
                GrabError::CaptureFailed(format!("Serialization error: {}", e))
            }
            GrabError::Tauri(e) => GrabError::CaptureFailed(format!("Tauri error: {}", e)),
            GrabError::Image(e) => GrabError::CaptureFailed(format!("Image error: {}", e)),
        }
    }
}

/// Result type alias for Grab operations
pub type GrabResult<T> = Result<T, GrabError>;
