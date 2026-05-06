#!/bin/bash
# Post-install setup for Linux: wrapper script + autostart entry.
#
# Why a wrapper: WebKitGTK on dual-GPU Linux systems crashes during EGL init
# unless software rendering is forced via env vars. These vars must be set in
# the parent process, before /usr/bin/grab loads its GL/EGL libraries — too
# late if set from inside main(). The wrapper sets them, then execs the binary.
#
# Run this once after installing the .deb:
#   sudo dpkg -i grab_*_amd64.deb
#   ./scripts/install-linux.sh

set -e

WRAPPER="$HOME/.local/bin/grab"
AUTOSTART="$HOME/.config/autostart/grab.desktop"

mkdir -p "$(dirname "$WRAPPER")" "$(dirname "$AUTOSTART")"

cat > "$WRAPPER" <<'EOF'
#!/bin/bash
export LIBGL_ALWAYS_SOFTWARE=1
export __GLX_VENDOR_LIBRARY_NAME=mesa
export WEBKIT_DISABLE_COMPOSITING_MODE=1
export WEBKIT_DISABLE_DMABUF_RENDERER=1
exec /usr/bin/grab "$@"
EOF
chmod +x "$WRAPPER"

cat > "$AUTOSTART" <<'EOF'
[Desktop Entry]
Type=Application
Name=Grab
Comment=Screen capture — start in tray
Exec=env LIBGL_ALWAYS_SOFTWARE=1 __GLX_VENDOR_LIBRARY_NAME=mesa WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_DMABUF_RENDERER=1 /usr/bin/grab
Icon=grab
Terminal=false
StartupWMClass=grab
X-GNOME-Autostart-enabled=true
NoDisplay=false
EOF

echo "Wrapper:    $WRAPPER"
echo "Autostart:  $AUTOSTART"
echo
echo "Done. The tray icon will appear on next login, or run 'grab' now to test."
echo "GNOME users: ensure the AppIndicator extension is enabled (it is, by default, on Ubuntu)."
