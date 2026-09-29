import { Amiri, Aref_Ruqaa, Cormorant_Garamond, El_Messiri, IBM_Plex_Sans_Arabic, Reem_Kufi } from "next/font/google";

export const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

// Display faces for invitation pages. Not preloaded: only the active theme's face is fetched.
export const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap", preload: false });
export const ruqaa = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-ruqaa", display: "swap", preload: false });
export const messiri = El_Messiri({ subsets: ["arabic", "latin"], weight: ["400", "600"], variable: "--font-messiri", display: "swap", preload: false });
export const kufi = Reem_Kufi({ subsets: ["arabic", "latin"], weight: ["400", "600"], variable: "--font-kufi", display: "swap", preload: false });
export const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-cormorant", display: "swap", preload: false });

export const inviteFontVars = [plex, amiri, ruqaa, messiri, kufi, cormorant].map((f) => f.variable).join(" ");
