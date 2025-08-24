import type { PluginOption } from 'vite'
import type { AuthConfig } from '@auth/core/types'
import type { APIContext, AstroGlobal } from 'astro'

export const virtualConfigModule = (configFile: string = './auth.config'): PluginOption => {
	const virtualModuleId = 'auth:config'
	const resolvedId = '\0' + virtualModuleId

	return {
		name: 'auth-astro-config',
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedId
			}
		},
		load: (id) => {
			if (id === resolvedId) {
				return `import authConfig from "${configFile}"; export default authConfig`
			}
		},
	}
}

export interface AstroAuthConfig {
	/**
	 * Defines the base path for the auth routes.
	 * @default '/api/auth'
	 */
	prefix?: string
	/**
	 * Defines whether or not you want the integration to handle the API routes
	 * @default true
	 */
	injectEndpoints?: boolean
	/**
	 * Path to the config file
	 */
	configFile?: string
}

export interface SpecifiedAuthConfig extends AstroAuthConfig, Omit<AuthConfig, 'raw'> {}
export type DynamicAuthConfig = (context: APIContext) => Promise<SpecifiedAuthConfig>
export type FullAuthConfig = SpecifiedAuthConfig | DynamicAuthConfig

export async function extractConfig(config: FullAuthConfig, context: APIContext): Promise<SpecifiedAuthConfig> {
	if (typeof config === 'function') {
		return await config(context)
	}

	return config
}

export function defineConfig(config: FullAuthConfig): FullAuthConfig {
	return async context => {
		const extractedConfig = await extractConfig(config, context)
		extractedConfig.prefix ??= '/api/auth'
		extractedConfig.basePath = extractedConfig.prefix
		return extractedConfig
	}
}
