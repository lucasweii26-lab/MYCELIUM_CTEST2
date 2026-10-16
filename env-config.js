const hostname = window.location.hostname.toLowerCase();
const isLoopbackHost = hostname === "localhost"
  || hostname === "::1"
  || hostname === "[::1]"
  || /^127(?:\.\d{1,3}){3}$/.test(hostname)
  || hostname.endsWith(".localhost");

// `import.meta.env.DEV` covers Vite; hostname checks cover VS Code Live Server.
// Local environments never request an IP/location service. Production receives
// only the validated country-code cookie written by the Netlify edge function.
export const IS_LOCAL_DEVELOPMENT = isLoopbackHost
  || window.MYCELIUM_LOCAL_PREVIEW === true
  || import.meta.env?.DEV === true;
export const IS_PRODUCTION = !IS_LOCAL_DEVELOPMENT;

function readLocalMockCountry() {
  const requested = new URLSearchParams(window.location.search).get("mockCountry");
  if (requested && /^[A-Za-z]{2}$/.test(requested)) return requested.toUpperCase();
  return "MY";
}

export const LOCAL_MOCK_COUNTRY_CODE = IS_LOCAL_DEVELOPMENT ? readLocalMockCountry() : "";

export function getInitialCountryHint() {
  if (IS_LOCAL_DEVELOPMENT) return LOCAL_MOCK_COUNTRY_CODE;

  const cookieHint = document.cookie.match(/(?:^|;\s*)myceliumCountryHint=([A-Z]{2})(?:;|$)/i)?.[1];
  return String(
    window.MYCELIUM_COUNTRY_HINT
      || document.documentElement.dataset.countryHint
      || cookieHint
      || "",
  ).toUpperCase();
}
