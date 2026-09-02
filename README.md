# Prime Solar Quotation Builder ☀️

An offline-first mobile and desktop application for **Prime Solar Energy (DHA Bahawalpur, Pakistan)** to size solar systems from electricity bills, generate branded 2-page quotation PDFs, and deliver them to customers via WhatsApp.

---

## 🌟 Key Features

1. **🧮 Bill-to-kW Sizing Calculator**:
   - Enter monthly electricity bill amount (PKR) ➡️ instantly calculate recommended kW capacity, panel count (585W Tier-1 bifacial), estimated monthly generation, savings, and payback period.
   - 1-tap jump to create quotation with auto-filled system parameters.

2. **📄 Pixel-Perfect 2-Page Branded PDF**:
   - Replicates Prime Solar's exact letterhead matching DHA Bahawalpur contact block, signature two-tone divider bar (70% Navy / 30% Orange), and centered subtle emblem watermark.
   - **Page 1**: Centered Title block + bordered line-items grid table with live itemized math + merged Total row with Valid Till date + yellow highlighted combined total with Lithium battery.
   - **Page 2**: Lithium-Ion battery reference price list table at top + Mode of Payment (70% Advance / 20% Dumping / 10% Commissioning) + Return on Investment (ROI) projections + two-tone footer bar.

3. **📑 4 Built-In Formats + In-App Custom Template Builder**:
   - *Simple Hybrid*, *Simple On-Grid*, *Detailed Split Breakers*, and *Detailed with Battery*.
   - Staff can create, duplicate, edit, and delete custom quotation formats directly inside the app without code updates.

4. **🔋 Editable Battery Option Manager**:
   - Add, edit, or delete battery models, capacities (kWh), price rates (Rs.), and warranties.
   - 1-tap selector to highlight a specific battery on Page 1 while displaying all options in the Page 2 table.

5. **📱 1-Tap WhatsApp Pitch Delivery**:
   - Pre-filled professional Urdu/English greeting and quotation breakdown sent directly via WhatsApp alongside the attached PDF.

6. **💾 Offline Storage**:
   - Zustand store backed by local AsyncStorage for offline quotes and custom templates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI / React Native environment

### Installation
```bash
# Clone the repository
git clone https://github.com/jamalullahdev/prime-solar-quote.git
cd prime-solar-quote

# Install dependencies
npm install --legacy-peer-deps

# Start Expo Dev Server
npx expo start
```

### Quick Commands (Windows Launcher)
Double-click `run-app.bat` to choose:
- `[1]` Open in Web Browser
- `[2]` Run on Android Device / Emulator
- `[3]` Start Expo Metro Server
- `[4]` Build Standalone Android APK (`build-apk.bat`)
- `[5]` Build EAS Cloud Android APK

---

## 🏛️ Branding & Colors
- **Prime Navy**: `#0B2A4A`
- **Solar Orange**: `#F5921E`
- **Deep Navy**: `#00152D`
- **Canvas Background**: `#F0F2F5`
- **Two-Tone Divider Bar**: Left 70% Navy (`#0B2A4A`) / Right 30% Orange (`#F5921E`)

---

## 📄 License
Private property of Prime Solar Energy, DHA Bahawalpur.
