export function isLoadingDiagnosticsEnabled({ viteDevelopment = false, hostname = '', search = '' } = {}) {
  const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  return (viteDevelopment || localHost)
    && new URLSearchParams(search).get('heroLoadingDebug') === '1';
}
