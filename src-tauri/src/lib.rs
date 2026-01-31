//! Grab - Screen Capture Application
//! Rust backend with Tauri
//!
//! Migrated from Electron to Tauri for better performance and smaller bundle size.

mod capture;
mod commands;
mod error;
mod history;
mod preferences;
mod tray;
mod types;

use tauri::{Manager, RunEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// Configure and run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            // Initialize preferences
            let preferences = preferences::PreferencesStore::new(app.handle())?;

            // Initialize history
            let history_store = history::HistoryStore::new(app.handle())?;

            // Store state
            app.manage(preferences);
            app.manage(history_store);

            // Setup system tray
            tray::setup_tray(app.handle())?;

            // Register global shortcuts
            register_global_shortcuts(app)?;

            // Window visibility controlled by tauri.conf.json

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Capture commands
            commands::capture_full_screen,
            commands::capture_region,
            commands::capture_window,
            commands::get_screen_sources,
            commands::get_window_sources,
            // History commands
            commands::get_history,
            commands::remove_from_history,
            commands::scan_directory,
            // Preferences commands
            commands::get_preferences,
            commands::set_preferences,
            commands::get_output_folder,
            commands::browse_folder,
            // File operations
            commands::save_image,
            commands::copy_to_clipboard,
            commands::delete_screenshot,
            commands::reveal_in_folder,
            commands::export_capture,
        ])
        .build(tauri::generate_context!())
        .expect("Error while building Tauri application");

    app.run(|app_handle, event| {
        match event {
            RunEvent::ExitRequested { .. } => {
                // Cleanup before exit
                if let Err(e) = cleanup_shortcuts(app_handle) {
                    eprintln!("Error cleaning up shortcuts: {}", e);
                }
            }
            _ => {}
        }
    });
}

/// Register global keyboard shortcuts
fn register_global_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _app_handle = app.handle().clone();

    // Get preferences to read configured shortcuts
    let prefs = app.state::<preferences::PreferencesStore>();
    let preferences = prefs.get();

    // Parse shortcuts from preferences
    let full_screen_shortcut: Shortcut = preferences.shortcuts.full_screen.parse()?;
    let region_shortcut: Shortcut = preferences.shortcuts.region.parse()?;
    let window_shortcut: Shortcut = preferences.shortcuts.window.parse()?;

    // Register shortcuts
    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    let handle = _app.clone();
                    if shortcut == &full_screen_shortcut {
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = commands::trigger_capture_full_screen(&handle).await {
                                eprintln!("Full screen capture failed: {}", e);
                            }
                        });
                    } else if shortcut == &region_shortcut {
                        // Region capture - show overlay window
                        if let Some(window) = _app.get_webview_window("overlay") {
                            window.show().ok();
                            window.set_focus().ok();
                        }
                    } else if shortcut == &window_shortcut {
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = commands::trigger_capture_window(&handle).await {
                                eprintln!("Window capture failed: {}", e);
                            }
                        });
                    }
                }
            })
            .build(),
    )?;

    // Register the shortcuts (gracefully handle conflicts)
    if let Err(e) = app.global_shortcut().register(full_screen_shortcut) {
        eprintln!("Warning: Could not register full screen shortcut: {}", e);
    }
    if let Err(e) = app.global_shortcut().register(region_shortcut) {
        eprintln!("Warning: Could not register region shortcut: {}", e);
    }
    if let Err(e) = app.global_shortcut().register(window_shortcut) {
        eprintln!("Warning: Could not register window shortcut: {}", e);
    }

    Ok(())
}

/// Cleanup shortcuts on exit
fn cleanup_shortcuts(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    app_handle.global_shortcut().unregister_all()?;
    Ok(())
}
