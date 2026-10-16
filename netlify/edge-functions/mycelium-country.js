// Provides a country-only hint for the initial visit. The user's raw IP is
// never read or persisted by this function.
export default async (_request, context) => {
  const countryCode = context.geo?.country?.code?.toUpperCase();
  const response = await context.next();

  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return response;

  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    `myceliumCountryHint=${countryCode}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`,
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
