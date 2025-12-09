import { defineConfig, mergeConfig } from 'vite';

export default defineConfig(({ mode }) => {
    const productionConfig = {
        esbuild: {
            drop: ['console']
        }
    };

    const commonConfig = {
    };

    if(mode === 'production')
        return mergeConfig(commonConfig, productionConfig);
    return commonConfig;
})
