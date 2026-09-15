import {defineConfig} from 'vite';

export default defineConfig({
 base:process.env.SLIME_BASE||'/',
});
