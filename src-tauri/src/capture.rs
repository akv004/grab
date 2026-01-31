//! Screen capture functionality
//!
//! Uses xcap for cross-platform screen capture.
//! Optimized for performance with fast PNG compression.

use crate::error::{GrabError, GrabResult};
use crate::types::{CaptureMetadata, CaptureMode, CaptureSource, RegionBounds};
use chrono::Utc;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::{ImageEncoder, RgbaImage};
use std::fs::File;
use std::io::BufWriter;
use std::path::PathBuf;
use xcap::{Monitor, Window};

/// Capture the full screen (primary monitor)
pub fn capture_full_screen() -> GrabResult<(RgbaImage, CaptureMetadata)> {
    let monitors = Monitor::all().map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    // Find primary monitor or use first available
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .or_else(|| Monitor::all().ok()?.into_iter().next())
        .ok_or_else(|| GrabError::SourceNotFound("No monitors found".to_string()))?;

    capture_monitor(&monitor)
}

/// Capture a specific display by ID
pub fn capture_display(display_id: &str) -> GrabResult<(RgbaImage, CaptureMetadata)> {
    let monitors = Monitor::all().map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let monitor = monitors
        .into_iter()
        .find(|m| m.id().map(|id| id.to_string()).unwrap_or_default() == display_id)
        .ok_or_else(|| GrabError::SourceNotFound(format!("Display {} not found", display_id)))?;

    capture_monitor(&monitor)
}

/// Capture a specific monitor
fn capture_monitor(monitor: &Monitor) -> GrabResult<(RgbaImage, CaptureMetadata)> {
    let image = monitor
        .capture_image()
        .map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let metadata = CaptureMetadata {
        mode: CaptureMode::FullScreen,
        display_id: monitor.id().ok().map(|id| id.to_string()),
        window_id: None,
        bounds: RegionBounds {
            x: monitor.x().unwrap_or(0),
            y: monitor.y().unwrap_or(0),
            width: monitor.width().unwrap_or(0),
            height: monitor.height().unwrap_or(0),
        },
        timestamp: Utc::now().to_rfc3339(),
        scale_factor: monitor.scale_factor().unwrap_or(1.0) as f64,
        file_name: None,
    };

    Ok((image, metadata))
}

/// Capture a specific window by ID
pub fn capture_window(window_id: &str) -> GrabResult<(RgbaImage, CaptureMetadata)> {
    let windows = Window::all().map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let window = windows
        .into_iter()
        .find(|w| w.id().map(|id| id.to_string()).unwrap_or_default() == window_id)
        .ok_or_else(|| GrabError::SourceNotFound(format!("Window {} not found", window_id)))?;

    let image = window
        .capture_image()
        .map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let metadata = CaptureMetadata {
        mode: CaptureMode::Window,
        display_id: None,
        window_id: window.id().ok().map(|id| id.to_string()),
        bounds: RegionBounds {
            x: window.x().unwrap_or(0),
            y: window.y().unwrap_or(0),
            width: window.width().unwrap_or(0),
            height: window.height().unwrap_or(0),
        },
        timestamp: Utc::now().to_rfc3339(),
        scale_factor: 1.0, // Windows don't have individual scale factors
        file_name: None,
    };

    Ok((image, metadata))
}

/// Capture a region of the screen
pub fn capture_region(
    region: &RegionBounds,
    display_id: Option<&str>,
) -> GrabResult<(RgbaImage, CaptureMetadata)> {
    // First capture the full screen or specified display
    let (full_image, mut metadata) = if let Some(id) = display_id {
        capture_display(id)?
    } else {
        capture_full_screen()?
    };

    // Crop to the specified region
    let x = region.x.max(0) as u32;
    let y = region.y.max(0) as u32;
    let width = region.width.min(full_image.width().saturating_sub(x));
    let height = region.height.min(full_image.height().saturating_sub(y));

    if width == 0 || height == 0 {
        return Err(GrabError::InvalidRequest(
            "Invalid region dimensions".to_string(),
        ));
    }

    let cropped = image::imageops::crop_imm(&full_image, x, y, width, height).to_image();

    metadata.mode = CaptureMode::Region;
    metadata.bounds = RegionBounds {
        x: region.x,
        y: region.y,
        width,
        height,
    };

    Ok((cropped, metadata))
}

/// Get all available screen sources (monitors)
pub fn get_screen_sources() -> GrabResult<Vec<CaptureSource>> {
    let monitors = Monitor::all().map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let sources = monitors
        .into_iter()
        .enumerate()
        .map(|(i, m)| {
            let id = m.id().map(|id| id.to_string()).unwrap_or_default();
            let width = m.width().unwrap_or(0);
            let height = m.height().unwrap_or(0);
            let is_primary = m.is_primary().unwrap_or(false);
            CaptureSource {
                id: id.clone(),
                name: format!(
                    "Display {}: {}x{}{}",
                    i + 1,
                    width,
                    height,
                    if is_primary { " (Primary)" } else { "" }
                ),
                thumbnail: None, // Could generate thumbnail if needed
                display_id: Some(id),
                app_icon: None,
            }
        })
        .collect();

    Ok(sources)
}

/// Get all available window sources
pub fn get_window_sources() -> GrabResult<Vec<CaptureSource>> {
    let windows = Window::all().map_err(|e| GrabError::CaptureFailed(e.to_string()))?;

    let sources = windows
        .into_iter()
        .filter(|w| {
            // Filter out empty windows and system windows
            let width = w.width().unwrap_or(0);
            let height = w.height().unwrap_or(0);
            let title = w.title().unwrap_or_default();
            width > 0 && height > 0 && !title.is_empty()
        })
        .map(|w| CaptureSource {
            id: w.id().map(|id| id.to_string()).unwrap_or_default(),
            name: w.title().unwrap_or_default(),
            thumbnail: None,
            display_id: None,
            app_icon: None,
        })
        .collect();

    Ok(sources)
}

/// Generate a filename based on the naming template
pub fn generate_filename(template: &str, mode: CaptureMode) -> String {
    let now = Utc::now();

    let mode_str = match mode {
        CaptureMode::FullScreen => "fullscreen",
        CaptureMode::Display => "display",
        CaptureMode::Window => "window",
        CaptureMode::Region => "region",
    };

    template
        .replace("{date}", &now.format("%Y-%m-%d").to_string())
        .replace("{time}", &now.format("%H-%M-%S").to_string())
        .replace("{mode}", mode_str)
        .replace("{timestamp}", &now.timestamp().to_string())
}

/// Save image to disk with optimized PNG compression
///
/// Uses fast compression for better performance while maintaining full quality.
pub fn save_image(image: &RgbaImage, path: &PathBuf) -> GrabResult<()> {
    let file = File::create(path)?;
    let writer = BufWriter::new(file);
    
    // Use fast compression - significantly faster than default with identical quality
    let encoder = PngEncoder::new_with_quality(writer, CompressionType::Fast, FilterType::Adaptive);
    
    encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| GrabError::Image(e))?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_filename() {
        let template = "grab-{date}-{time}-{mode}";
        let filename = generate_filename(template, CaptureMode::FullScreen);

        assert!(filename.starts_with("grab-"));
        assert!(filename.contains("fullscreen"));
    }
}
