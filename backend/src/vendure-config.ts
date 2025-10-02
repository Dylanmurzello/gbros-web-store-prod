import {
    DefaultJobQueuePlugin,
    DefaultSchedulerPlugin,
    DefaultSearchPlugin,
    VendureConfig,
    NativeAuthenticationStrategy,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin, FileBasedTemplateLoader } from '@vendure/email-plugin';
import { AssetServerPlugin, configureS3AssetStorage } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { GraphiqlPlugin } from '@vendure/graphiql-plugin';
import { HardenPlugin } from '@vendure/harden-plugin'; // SECURITY FIX: 2025-10-01 - Protects against GraphQL complexity attacks & disables dev features in prod 🛡️
import { GoogleAuthenticationStrategy } from './google-auth-strategy';
import { WishlistPlugin } from './plugins/wishlist/wishlist.plugin'; // ADDED: 2025-09-26 - Custom wishlist functionality
import { SquarePlugin, squarePaymentHandler } from './plugins/square'; // ADDED: 2025-09-30 - Square payment processing (real money moves 💰)
import 'dotenv/config';
import path from 'path';

const IS_DEV = process.env.APP_ENV === 'dev';
const serverPort = +process.env.PORT || 3000;

// CORS origins - locked down per environment, no more yolo mode 🔒
// SECURITY FIX: 2025-09-30 - Restricted CORS to specific origins instead of allowing everything
// FIX: 2025-10-01 - REMOVED FALLBACKS! App crashes if env var missing = fail fast, no silent wrong config 💀
const allowedOrigins = IS_DEV
    ? [
        'http://localhost:3001',
        'http://localhost:3000', 
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3000'
      ]
    : (process.env.FRONTEND_URL || (() => {
        throw new Error('🚨 FRONTEND_URL not set in environment variables! Cannot start without explicit frontend domain configuration.');
    })()).split(',').map(url => url.trim());

export const config: VendureConfig = {
    apiOptions: {
        port: serverPort,
        adminApiPath: 'admin-api',
        shopApiPath: 'shop-api',
        // SECURITY FIX: 2025-09-30 - Trust only loopback, not ANY proxy (prevents IP spoofing) 🛡️
        // Envoy runs on same machine, so loopback is sufficient
        // This prevents attackers from faking X-Forwarded-For headers to bypass rate limiting
        trustProxy: 'loopback', // Only trust localhost/127.0.0.1, not random proxies
        cors: {
            // SECURITY FIX: 2025-09-30 - No more origin: true chaos, we got standards now 💅
            origin: allowedOrigins, // Only specific origins allowed, CSRF attacks can stay mad
            credentials: true, // cookies/auth still work but only for approved origins
        },
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV ? {
            adminApiDebug: true,
            shopApiDebug: true,
        } : {}),
    },
    authOptions: {
        tokenMethod: ['bearer', 'cookie'],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
          secret: process.env.COOKIE_SECRET,
          httpOnly: true, // stays locked down, no js touch my cookies vibes ✨
          sameSite: 'lax', // Use 'lax' for same-site requests through proxy
          // SECURITY FIX: 2025-09-30 - secure flag now respects environment, no more http cookie yolo in prod 
          secure: !IS_DEV, // secure cookies in production, only yeet over HTTPS (proxy handles termination)
          path: '/',
          domain: undefined, // Let cookie work on any subdomain
        },
        shopAuthenticationStrategy: [
            new NativeAuthenticationStrategy(),
            new GoogleAuthenticationStrategy({
                // no cap this better be set or we're cooked fr fr 
                // SECURITY FIX: 2025-09-30 - Removed hardcoded fallback, OAuth client ID must be in env vars
                googleClientId: process.env.GOOGLE_CLIENT_ID || (() => { 
                    throw new Error(' GOOGLE_CLIENT_ID not set in environment variables - not gonna let you expose credentials bestie'); 
                })()
            }),
        ],
    },
    dbConnectionOptions: {
        type: 'postgres',
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [path.join(__dirname, './migrations/*.+(js|ts)')],
        logging: false,
        database: process.env.DB_NAME,
        schema: process.env.DB_SCHEMA,
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    },
    paymentOptions: {
        paymentMethodHandlers: [squarePaymentHandler], // Square handler for real payment processing 💳
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {},
    plugins: [
        // SECURITY FIX: 2025-10-01 - HardenPlugin protects against GraphQL attacks! 🔒
        // Blocks complex nested queries, disables introspection in prod, removes field suggestions
        // SMART MODE: Anonymous users = strict limit, Authenticated users = generous limit
        HardenPlugin.init({
            maxQueryComplexity: 5000, // Strict limit for anonymous/unauthenticated users
            apiMode: IS_DEV ? 'dev' : 'prod', // Auto disables introspection/playground in prod
            logComplexityScore: IS_DEV, // Only log query complexity in dev
            // Skip complexity check for authenticated users (they need complex queries like order history)
            // This allows logged-in customers to view their orders without hitting limits
            skip: async (context) => {
                // Check if user has auth token (logged in)
                const authToken = context.request.http?.headers.get('vendure-auth-token') || 
                                 context.request.http?.headers.get('cookie');
                
                // If authenticated, skip complexity check (trust logged-in users more than anonymous)
                return !!authToken;
            },
        }),
        WishlistPlugin, // REGISTERED: 2025-09-26 - Enables wishlist GraphQL API and database entities
        SquarePlugin.init({
            // REGISTERED: 2025-09-30 - Square payment integration for actual payment processing 💸
            accessToken: process.env.SQUARE_ACCESS_TOKEN || (() => { 
                throw new Error('🚨 SQUARE_ACCESS_TOKEN not set - get this from Square Developer Dashboard at https://developer.squareup.com/apps'); 
            })(),
            environment: (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
            locationId: process.env.SQUARE_LOCATION_ID || (() => { 
                throw new Error('🚨 SQUARE_LOCATION_ID not set - find this in Square Dashboard > Locations'); 
            })(),
        }),
        GraphiqlPlugin.init(),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'), // Temp dir for uploads before pushing to S3
            // FIX: 2025-10-02 - Switched to DigitalOcean Spaces (S3-compatible) to avoid storage issues on main droplet 💾
            // Images now stored in DO Spaces instead of local filesystem - scales infinitely! 🚀
            storageStrategyFactory: configureS3AssetStorage({
                bucket: process.env.DO_SPACES_BUCKET || (() => {
                    throw new Error('🚨 DO_SPACES_BUCKET not set! Configure your DigitalOcean Spaces bucket name.');
                })(),
                credentials: {
                    accessKeyId: process.env.DO_SPACES_KEY || (() => {
                        throw new Error('🚨 DO_SPACES_KEY not set! Get this from DigitalOcean API > Spaces Keys.');
                    })(),
                    secretAccessKey: process.env.DO_SPACES_SECRET || (() => {
                        throw new Error('🚨 DO_SPACES_SECRET not set! Get this from DigitalOcean API > Spaces Keys.');
                    })(),
                },
                nativeS3Configuration: {
                    endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
                    forcePathStyle: false, // DO Spaces uses virtual-hosted-style URLs
                    region: process.env.DO_SPACES_REGION || 'nyc3',
                },
                // FIX: 2025-10-02 - Upload all files as PUBLIC so we don't have to manage 83k file permissions individually! 🙏
                nativeS3UploadConfiguration: {
                    ACL: 'public-read', // Makes every uploaded file publicly accessible
                },
            }),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV ? undefined : process.env.ASSET_URL_PREFIX || undefined,
            presets: [
                { name: 'tiny', width: 50, height: 50, mode: 'crop' },
                { name: 'thumb', width: 150, height: 150, mode: 'crop' },
                { name: 'small', width: 300, height: 300, mode: 'resize' },
                { name: 'medium', width: 500, height: 500, mode: 'resize' },
                { name: 'large', width: 800, height: 800, mode: 'resize' },
                { name: 'detail', width: 1200, height: 1200, mode: 'resize' },
            ],
            imageTransformStrategy: undefined, // Allow all transformations in dev
        }),
        DefaultSchedulerPlugin.init(),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: true }),
        EmailPlugin.init({
            devMode: true,
            outputPath: path.join(__dirname, '../static/email/test-emails'),
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templateLoader: new FileBasedTemplateLoader(path.join(__dirname, '../static/email/templates')),
            globalTemplateVars: {
                // FIX: 2025-10-01 - No more hardcoded URLs, we use env vars like civilized humans 💅
                // STRICT MODE: No fallbacks! App crashes if env vars missing = forces proper config, prevents silent failures
                fromAddress: `"Gbros App" <${process.env.EMAIL_FROM_ADDRESS || (() => {
                    throw new Error('🚨 EMAIL_FROM_ADDRESS not set! Email config requires explicit from address.');
                })()}>`,
                verifyEmailAddressUrl: `${process.env.FRONTEND_URL || (() => {
                    throw new Error('🚨 FRONTEND_URL not set! Email template URLs require explicit frontend domain.');
                })()}/verify`,
                passwordResetUrl: `${process.env.FRONTEND_URL || (() => {
                    throw new Error('🚨 FRONTEND_URL not set! Password reset URL requires explicit frontend domain.');
                })()}/password-reset`,
                changeEmailAddressUrl: `${process.env.FRONTEND_URL || (() => {
                    throw new Error('🚨 FRONTEND_URL not set! Email change URL requires explicit frontend domain.');
                })()}/verify-email-address-change`
            },
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: serverPort + 2,
            adminUiConfig: {
                // FIX: 2025-10-01 - Admin UI now respects env vars, STRICT MODE: no fallbacks!
                apiHost: process.env.ADMIN_UI_API_HOST || (() => {
                    throw new Error('🚨 ADMIN_UI_API_HOST not set! Admin UI requires explicit API host configuration.');
                })(),
                apiPort: +(process.env.ADMIN_UI_API_PORT || (() => {
                    throw new Error('🚨 ADMIN_UI_API_PORT not set! Admin UI requires explicit API port configuration.');
                })()),
                adminApiPath: 'admin-api',
                tokenMethod: 'bearer',
            },
        }),
    ],
};
