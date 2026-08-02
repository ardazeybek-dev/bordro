import { defineConfig } from "tsup";

export default defineConfig([
  // npm paketi: kütüphane + CLI
  {
    entry: ["src/index.ts", "src/cli.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    target: "node18",
  },
  // Tanıtım sayfasının kullandığı tarayıcı derlemesi.
  // Hesap mantığı tek kaynaktan gelsin diye sayfa kendi kopyasını tutmaz.
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    outDir: "docs",
    target: "es2022",
    minify: true,
    dts: false,
    clean: false,
  },
]);
