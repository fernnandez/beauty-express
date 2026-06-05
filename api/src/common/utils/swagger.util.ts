import { OpenAPIObject } from '@nestjs/swagger';

export function filterSwaggerPaths(
  document: OpenAPIObject,
  predicate: (path: string) => boolean,
): OpenAPIObject {
  const paths = Object.fromEntries(
    Object.entries(document.paths ?? {}).filter(([path]) => predicate(path)),
  );

  return {
    ...document,
    paths,
  };
}

export function isAdminSwaggerPath(path: string): boolean {
  return path.startsWith('/admin') || path.startsWith('/auth/admin');
}
