/**
 * Compartido: seeder (`pg.Client`) y Nest (`TypeOrmModule`).
 * Quita params SSL del connection string y aplica `ssl` explícito para Node/pg
 * (evita que sslmode en la URL pise rejectUnauthorized).
 */

const POSTGRES_URL_SSL_QUERY_KEYS = [
  'sslmode',
  'ssl',
  'sslcert',
  'sslkey',
  'sslrootcert',
  'sslsni',
  'uselibpqcompat',
];

function stripSslQueryParamsFromPostgresUrl(raw) {
  const trimmed = raw.trim();
  const forParse = trimmed.replace(/^postgres(ql)?:/i, 'http:');
  let parsed;
  try {
    parsed = new URL(forParse);
  } catch {
    return raw;
  }

  for (const key of POSTGRES_URL_SSL_QUERY_KEYS) {
    parsed.searchParams.delete(key);
  }

  const query = parsed.searchParams.toString();
  const path = `${parsed.pathname}${query ? `?${query}` : ''}`;
  const port = parsed.port ? `:${parsed.port}` : '';
  const auth =
    parsed.username !== '' || parsed.password !== ''
      ? `${encodeURIComponent(parsed.username)}${
          parsed.password ? `:${encodeURIComponent(parsed.password)}` : ''
        }@`
      : '';

  return `postgresql://${auth}${parsed.hostname}${port}${path}`;
}

function isPlainLocalPostgresUrl(url) {
  const lower = url.toLowerCase();
  return (
    (lower.includes('localhost') || lower.includes('127.0.0.1')) &&
    !lower.includes('sslmode=') &&
    !lower.includes('ssl=true')
  );
}

/**
 * @param {string} rawUrl PRODUCTS_DATABASE_URL sin validar vacío.
 * @param {boolean} sslRejectUnauthorized valor de PRODUCTS_DATABASE_SSL_REJECT_UNAUTHORIZED === 'true'
 * @returns {{ url: string, ssl?: { rejectUnauthorized: boolean } }}
 */
function resolveProductsPostgresTls(rawUrl, sslRejectUnauthorized) {
  const url = stripSslQueryParamsFromPostgresUrl(rawUrl.trim());
  if (isPlainLocalPostgresUrl(url)) {
    return { url };
  }
  return {
    url,
    ssl: { rejectUnauthorized: sslRejectUnauthorized },
  };
}

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ connectionString: string, ssl?: import('pg').ClientConfig['ssl'] }}
 */
function buildProductsPgClientConfig(env) {
  const raw = env.PRODUCTS_DATABASE_URL?.trim();
  if (!raw) {
    throw new Error('PRODUCTS_DATABASE_URL is not set.');
  }
  const strict = env.PRODUCTS_DATABASE_SSL_REJECT_UNAUTHORIZED === 'true';
  return buildPgClientConfigFromUrl(raw, strict);
}

/**
 * @param {string} rawUrl
 * @param {boolean} sslRejectUnauthorized
 * @returns {{ connectionString: string, ssl?: import('pg').ClientConfig['ssl'] }}
 */
function buildPgClientConfigFromUrl(rawUrl, sslRejectUnauthorized) {
  const raw = rawUrl?.trim();
  if (!raw) {
    throw new Error('Postgres URL is empty or not set.');
  }
  const { url, ssl } = resolveProductsPostgresTls(raw, sslRejectUnauthorized);
  return ssl !== undefined
    ? { connectionString: url, ssl }
    : { connectionString: url };
}

module.exports = {
  stripSslQueryParamsFromPostgresUrl,
  isPlainLocalPostgresUrl,
  resolveProductsPostgresTls,
  buildPgClientConfigFromUrl,
  buildProductsPgClientConfig,
};
