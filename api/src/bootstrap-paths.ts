import { register } from 'tsconfig-paths';
import { join } from 'path';

/**
 * Registra aliases em runtime para o código compilado em dist/.
 * Necessário quando o compilador incremental não reescreve os paths.
 */
register({
  baseUrl: join(__dirname),
  paths: {
    '@application/*': ['application/*'],
    '@domain/*': ['domain/*'],
    '@config/*': ['config/*'],
    '@common/*': ['common/*'],
  },
});
