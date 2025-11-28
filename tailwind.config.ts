import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      colors: {
        vz_purple: "#A45CFF",
        vz_purple_dark: "#7538F5",
        vz_green: "#A4FF4F",
        vz_text: "#0A0A0A",
      },
      backgroundImage: {
        "vz-gradient":
          "linear-gradient(180deg, #A45CFF 0%, #D6C6FF 55%, #FAF9FF 100%)",
      },
    },
  },
};

export default config;
