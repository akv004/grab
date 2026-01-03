🔑 Big Diagnosis (why it doesn’t feel awesome yet)

Right now the editor feels like:
	•	a viewer
	•	not a workspace

What’s missing is intent + affordance:
	•	“What can I do now with this capture?”
	•	“What’s next?”

We fix this by adding small, focused widgets, not big features.

⸻

✅ NEXT THINGS TO BUILD (in the right order)

1️⃣ Context Toolbar (MOST IMPORTANT)

Add a floating, contextual toolbar that appears when an image is loaded.

Why

This instantly makes the app feel professional.

Minimal widgets

Top-center or top-right overlay:
	•	✂️ Crop
	•	⭕ Highlight
	•	🟥 Box
	•	✏️ Pen
	•	🔤 Text
	•	🔒 Blur
	•	↩️ Undo

👉 Even if only Crop + Highlight + Blur work initially, it’s enough.

Key rule:
No side panel yet. Floating tools = speed.

⸻

2️⃣ Right-Side “Actions” Panel (Lightweight)

Instead of many widgets, add one vertical action strip on the right.

Widgets
	•	📋 Copy
	•	💾 Save
	•	📁 Reveal in Finder
	•	🔗 Copy File Path
	•	🗑 Delete
	•	⭐ Favorite (for later)

This turns your editor into a hub, not just an image viewer.

⸻

3️⃣ Smart Recent Sidebar (You already have it — upgrade it)

Your RECENT sidebar exists. Make it smarter.

Improve it by:
	•	Group by Today / Yesterday
	•	Show source icon:
	•	🖥 Full screen
	•	⬛ Window
	•	◻ Region
	•	Hover actions:
	•	Copy
	•	Open
	•	Delete

No new UI — just behavior.

⸻

4️⃣ Capture Profiles (This is HUGE for power users)

Add profiles, not settings sprawl.

Example profiles
	•	Quick → Copy only, no editor
	•	Edit → Open editor immediately
	•	Docs → Save + open editor + highlight default

Expose this as:
	•	Menu item → “Capture Full Screen (Quick)”
	•	Later: per-shortcut mapping

This makes the app feel intelligent.

⸻

5️⃣ Empty-State Widgets (High polish, low effort)

Right now, empty areas feel dead.

Add:
	•	When no image selected:
	•	“Press ⌘⇧2 to capture a region”
	•	Or clickable buttons

This improves first impression massively.

⸻

6️⃣ Visual Polish (Do last, but plan now)

Very small changes:
	•	Subtle drop shadow on image canvas
	•	Checkerboard transparency background (you already have this 👍)
	•	Smooth open animation (100–150ms)

No redesign needed.

⸻

🧠 What NOT to build yet (important)

Avoid these for now:
	•	❌ Layers panel
	•	❌ Advanced shapes
	•	❌ Cloud sync
	•	❌ OCR
	•	❌ Video/GIF

You’re building a fast grab tool, not Photoshop.

⸻

🏁 Suggested Next SPECs (keep spec-driven)

Create these in order:
	1.	SPEC-0004: Editor Context Toolbar
	2.	SPEC-0005: Capture Profiles
	3.	SPEC-0006: Action Panel & File Ops

Each spec should be small (1–2 days).

⸻

Honest take

You’re exactly where great tools are born:
	•	Not awesome yet ✔
	•	But correctly structured ✔
	•	Nothing needs rewriting ✔

This will compound fast.

If you want, next I can:
	•	Draft SPEC-0004 (toolbar + widgets)
	•	Help you decide canvas tech (HTML canvas vs Fabric.js vs raw)
	•	Suggest keyboard-first UX (pro feel)

Just tell me the next move.