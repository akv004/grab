//! System tray functionality
//!
//! Creates and manages the system tray icon and menu.

use crate::capture;
use crate::error::GrabResult;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager,
};

/// Setup the system tray
pub fn setup_tray(app_handle: &AppHandle) -> GrabResult<()> {
    // Get available monitors for submenu
    let screen_sources = capture::get_screen_sources().unwrap_or_default();
    
    // Create Full Screen submenu with monitor options
    let mut fullscreen_items: Vec<MenuItem<_>> = Vec::new();
    
    for source in &screen_sources {
        let item = MenuItem::with_id(
            app_handle,
            format!("capture_monitor_{}", source.id),
            &source.name,
            true,
            None::<&str>,
        )?;
        fullscreen_items.push(item);
    }
    
    // Create the submenu
    let fullscreen_submenu = Submenu::with_id_and_items(
        app_handle,
        "capture_fullscreen",
        "Capture Full Screen",
        true,
        &fullscreen_items.iter().map(|i| i as &dyn tauri::menu::IsMenuItem<_>).collect::<Vec<_>>(),
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
            &fullscreen_submenu,
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
        .show_menu_on_left_click(true)
        .on_menu_event(move |app, event| {
            eprintln!("DEBUG: Tray menu event: {}", &event.id.0);
            handle_tray_event(app, &event.id.0);
        })
        .build(app_handle)?;

    Ok(())
}

/// Handle tray menu events
fn handle_tray_event(app: &AppHandle, event_id: &str) {
    // Handle monitor-specific capture from submenu
    if event_id.starts_with("capture_monitor_") {
        let monitor_id = event_id.strip_prefix("capture_monitor_").unwrap().to_string();
        let handle = app.clone();
        tauri::async_runtime::spawn(async move {
            eprintln!("DEBUG: Tray capturing monitor: {}", monitor_id);
            if let Err(e) = crate::commands::trigger_capture_display(&handle, &monitor_id).await {
                eprintln!("Monitor capture failed: {}", e);
            }
        });
        return;
    }
    
    match event_id {
        "capture_fullscreen" => {
            // Fallback: Show main window with screen picker
            if let Some(window) = app.get_webview_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to show screen picker
                window.emit("show-screen-picker", ()).ok();
            }
        }
        "capture_region" => {
            // Open region selection overlay
            if let Some(window) = app.get_webview_window("main") {
                // Emit event to show region selector
                window.emit("start-region-select", ()).ok();
            }
        }
        "capture_window" => {
            // Show main window with window picker
            if let Some(window) = app.get_webview_window("main") {
                window.show().ok();
                window.set_focus().ok();
                // Emit event to show window picker
                window.emit("show-window-picker", ()).ok();
            }
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
