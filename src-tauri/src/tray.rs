//! System tray functionality
//!
//! Creates and manages the system tray icon and menu.

use crate::commands;
use crate::error::GrabResult;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

/// Setup the system tray
pub fn setup_tray(app_handle: &AppHandle) -> GrabResult<()> {
    // Create menu items
    let capture_fullscreen = MenuItem::with_id(
        app_handle,
        "capture_fullscreen",
        "Capture Full Screen",
        true,
        Some("CommandOrControl+Shift+1"),
    )?;

    let capture_region = MenuItem::with_id(
        app_handle,
        "capture_region",
        "Capture Region",
        true,
        Some("CommandOrControl+Shift+2"),
    )?;

    let capture_window = MenuItem::with_id(
        app_handle,
        "capture_window",
        "Capture Window",
        true,
        Some("CommandOrControl+Shift+3"),
    )?;

    let separator1 = PredefinedMenuItem::separator(app_handle)?;

    let open_editor = MenuItem::with_id(app_handle, "open_editor", "Open Editor", true, None::<&str>)?;

    let settings = MenuItem::with_id(app_handle, "settings", "Settings...", true, None::<&str>)?;

    let separator2 = PredefinedMenuItem::separator(app_handle)?;

    let quit = MenuItem::with_id(
        app_handle,
        "quit",
        "Quit Grab",
        true,
        Some("CommandOrControl+Q"),
    )?;

    // Build the menu
    let menu = Menu::with_items(
        app_handle,
        &[
            &capture_fullscreen,
            &capture_region,
            &capture_window,
            &separator1,
            &open_editor,
            &settings,
            &separator2,
            &quit,
        ],
    )?;

    // Create the tray icon
    let _tray = TrayIconBuilder::new()
        .icon(app_handle.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Grab - Screen Capture")
        .menu_on_left_click(true)
        .on_menu_event(move |app, event| {
            handle_tray_event(app, &event.id.0);
        })
        .build(app_handle)?;

    Ok(())
}

/// Handle tray menu events
fn handle_tray_event(app: &AppHandle, event_id: &str) {
    match event_id {
        "capture_fullscreen" => {
            let handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = commands::trigger_capture_full_screen(&handle).await {
                    eprintln!("Full screen capture failed: {}", e);
                }
            });
        }
        "capture_region" => {
            // Open region selection overlay
            if let Some(window) = app.get_webview_window("main") {
                // Emit event to show region selector
                window.emit("start-region-select", ()).ok();
            }
        }
        "capture_window" => {
            let handle = app.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = commands::trigger_capture_window(&handle).await {
                    eprintln!("Window capture failed: {}", e);
                }
            });
        }
        "open_editor" => {
            if let Some(window) = app.get_webview_window("main") {
                window.show().ok();
                window.set_focus().ok();
            }
        }
        "settings" => {
            if let Some(window) = app.get_webview_window("main") {
                window.show().ok();
                window.set_focus().ok();
                window.emit("open-settings", ()).ok();
            }
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}
