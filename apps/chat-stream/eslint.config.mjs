import { baseRules } from '../../eslint.base.mjs';
import tseslint from 'typescript-eslint';

export default tseslint.config({ ignores: ['dist/**'] }, ...baseRules);
